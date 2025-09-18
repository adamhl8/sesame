import { getAddedRemovedDiff } from "@/plugins/lib/lib"
import { PluginBuilder } from "@/core/plugin/builder.ts"
import { $ } from "bun"

interface BrewCasksDiff {
  added: string[]
  removed: string[]
}

const brewCasks = PluginBuilder.new<string[]>({ name: "Brew Casks" })
  .diff<BrewCasksDiff>(async (_, _previous, casks) => {
    const current = (await $`brew ls --cask -1`.quiet()).text().trim().split("\n")
    return getAddedRemovedDiff(casks, current)
  })
  .handle(async (_, diff) => {
    if (diff.removed.length > 0) {
      for (const cask of diff.removed) await $`brew uninstall --cask ${cask}`
    }
    if (diff.added.length > 0) {
      for (const cask of diff.added) await $`brew install --cask ${cask}`
    }
  })
  .update(async () => {
    await $`brew update`
  })
  .build()

export { brewCasks }
