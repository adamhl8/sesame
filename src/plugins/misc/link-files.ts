import fs from "node:fs/promises"
import path from "node:path"
import { resolvePath } from "@/lib.ts"
import { createPlugin } from "@/plugin.ts"
import { $ } from "bun"

interface Link {
  source: string
  dest: string
}

interface LinkFilesChange {
  added: Link[]
  removed: Link[]
}

const linkFiles = createPlugin<Link[], LinkFilesChange>(
  { name: "Link Files" },
  {
    diff: async (_, previous, links) => {
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
    },
    handle: async (ctx, change) => {
      if (change.removed.length > 0) {
        for (const link of change.removed) {
          await $`rm -f ${link.dest}`
          ctx.logger.info(`Removed link ${link.dest}`)
        }
      }
      if (change.added.length > 0) {
        for (const link of change.added) {
          await $`mkdir -p ${path.dirname(link.dest)}`
          await $`ln -f -s ${link.source} ${link.dest}`
          ctx.logger.info(`Linked ${link.source} to ${link.dest}`)
        }
      }
    },
  },
  async (links) => {
    const expandedLinks: Link[] = []
    for (const link of links) {
      const glob = new Bun.Glob(link.source)
      const files = await Array.fromAsync(glob.scan({ dot: true }))
      for (const file of files) {
        const source = await resolvePath(file)
        let dest = await resolvePath(link.dest)
        dest = dest.endsWith(path.basename(source)) ? dest : path.join(dest, path.basename(source))
        expandedLinks.push({ source, dest })
      }
    }
    return expandedLinks
  },
)

export { linkFiles }
