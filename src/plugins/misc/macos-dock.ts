import { getAddedRemovedDiff } from "@/lib.ts"
import { createPlugin } from "@/plugin.ts"
import { $ } from "bun"

interface MacosDockDiff {
  added: string[]
  removed: string[]
}

const macosDock = createPlugin<string[], MacosDockDiff>(
  { name: "MacOS Dock" },
  {
    diff: (_, previous, items) => getAddedRemovedDiff(items, previous ?? []),
    handle: async (_, __, items) => {
      await $`dockutil --no-restart --remove all`.quiet()
      for (const [index, item] of items.entries()) {
        const isLast = index === items.length - 1
        const shouldRestart = { raw: isLast ? "" : "--no-restart" }
        await $`dockutil ${shouldRestart} --add ${item}`.quiet()
      }
    },
  },
  (items) => items.map((item) => (item.startsWith("/Applications/") ? item : `/Applications/${item}.app`)),
)

export { macosDock }
