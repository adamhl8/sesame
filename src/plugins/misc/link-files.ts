/** biome-ignore-all lint/performance/noAwaitInLoops: ignore */
import fs from "node:fs/promises"
import path from "node:path"
import { $ } from "bun"

import { resolvePath } from "~/core/lib/path.ts"
import { PluginBuilder } from "~/core/plugin/builder.ts"

interface Link {
  source: string
  dest: string
}

interface LinkFilesChange {
  added: Link[]
  removed: Link[]
}

export const linkFiles = PluginBuilder.new<Link[]>({ name: "Link Files" })
  .transform(async (links) => await _expandAndResolveLinks(links))
  .diff<LinkFilesChange>(async (_, previous, links) => {
    const current: Link[] = []
    for (const link of links) {
      try {
        const target = await fs.readlink(link.dest)
        if (target === link.source) current.push(link)
      } catch {
        // ignore if file doesn't exist or isn't a symlink
      }
    }

    const toKey = (link: Link) => `${link.source}:${link.dest}`

    const currentSet = new Set(current.map(toKey))
    const desiredSet = new Set(links.map(toKey))

    // in desired but not in current
    const added = links.filter((link) => !currentSet.has(toKey(link)))

    // in previous but not in desired
    const removed = (previous ?? []).filter((link) => !desiredSet.has(toKey(link)))

    if (added.length === 0 && removed.length === 0) return
    return { added, removed }
  })
  .handle(async (ctx, change, _) => {
    if (change.removed.length > 0) {
      for (const link of change.removed) {
        await _removeLink(link)
        ctx.logger.info(`Removed link ${link.dest}`)
      }
    }
    if (change.added.length > 0) {
      for (const link of change.added) {
        await _createLink(link)
        ctx.logger.info(`Linked ${link.source} to ${link.dest}`)
      }
    }
  })
  .build()

async function _removeLink(link: Link) {
  await $`rm -f ${link.dest}`
}

export async function _createLink(link: Link) {
  await fs.mkdir(path.dirname(link.dest), { recursive: true })
  await fs.symlink(link.source, link.dest)
}

export async function _expandAndResolveLinks(links: Link[]) {
  const expandedLinks: Link[] = []
  for (const link of links) {
    const glob = new Bun.Glob(await resolvePath(link.source))
    const files = await Array.fromAsync(glob.scan({ dot: true }))

    // This shouldn't be necessary, but Bun.Glob doesn't work with absolute paths
    // https://github.com/oven-sh/bun/issues/16709
    if (files.length === 0) {
      const fileExists = await Bun.file(link.source).exists()
      if (fileExists) files.push(link.source)
    }

    if (files.length === 0) {
      throw new Error(`No files found for ${link.source}`)
    }

    // sort links so the order matches the order you'd expect
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })
    files.sort((a, b) => collator.compare(a, b))

    for (const file of files) {
      const source = await resolvePath(file)
      let dest = await resolvePath(link.dest)
      dest = dest.endsWith(path.basename(source)) ? dest : path.join(dest, path.basename(source))
      expandedLinks.push({ source, dest })
    }
  }
  return expandedLinks
}
