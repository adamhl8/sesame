import { $ } from "bun"

import { PluginBuilder } from "@/core/plugin/builder.ts"
import { getAddedRemovedDiff } from "@/plugins/lib/lib"

interface MacosDockDiff {
  added: string[]
  removed: string[]
}

const macosDock = PluginBuilder.new<string[]>({ name: "MacOS Dock" })
  .transform(async (items) =>
    items.map((item) => (item.startsWith("/Applications/") ? item : `/Applications/${item}.app`)),
  )
  .diff<MacosDockDiff>((_, previous, items) => getAddedRemovedDiff(items, previous ?? []))
  .handle(async (_, __, items) => {
    await $`dockutil --no-restart --remove all`.quiet()
    for (const [index, item] of items.entries()) {
      const isLast = index === items.length - 1
      const shouldRestart = { raw: isLast ? "" : "--no-restart" }
      await $`dockutil ${shouldRestart} --add ${item}`.quiet()
    }
  })
  .build()

export { macosDock }
