import { getAddedRemovedDiff } from "@/lib.ts"
import { createPlugin } from "@/plugin.ts"
import { $ } from "bun"

interface BrewCasksDiff {
  added: string[]
  removed: string[]
}

const brewCasks = createPlugin<string[], BrewCasksDiff>(
  { name: "Brew Casks" },
  {
    diff: async (_, _previous, casks) => {
      const current = (await $`brew ls --cask -1`.quiet()).text().trim().split("\n")
      return getAddedRemovedDiff(casks, current)
    },
    handle: async (_, diff) => {
      if (diff.removed.length > 0) {
        for (const cask of diff.removed) await $`brew uninstall --cask ${cask}`
      }
      if (diff.added.length > 0) {
        for (const cask of diff.added) await $`brew install --cask ${cask}`
      }
    },
    update: async () => {
      await $`brew update`
    },
  },
)

export { brewCasks }
