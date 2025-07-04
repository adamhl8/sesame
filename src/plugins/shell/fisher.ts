import { getAddedRemovedDiff } from "@/plugins/lib/lib"
import { createPlugin } from "@/plugin.ts"
import { runFishCmd } from "@/core/lib/utils"

interface FisherDiff {
  isFisherInstalled: boolean
  added: string[]
  removed: string[]
}

const fisher = createPlugin<string[], FisherDiff>(
  { name: "Fisher Plugins" },
  {
    diff: async (_, _previous, plugins) => {
      const isFisherInstalled = (await runFishCmd("type -q fisher").nothrow()).exitCode === 0
      const current = isFisherInstalled
        ? (await runFishCmd("fisher list").quiet())
            .text()
            .trim()
            .split("\n")
            .filter((p) => p !== "jorgebucaran/fisher")
        : []
      const diff = getAddedRemovedDiff(plugins, current)
      if (isFisherInstalled && !diff) return
      return { isFisherInstalled, added: diff?.added ?? [], removed: diff?.removed ?? [] }
    },
    handle: async (_, diff) => {
      if (!diff.isFisherInstalled) {
        await runFishCmd(
          "curl -sL https://raw.githubusercontent.com/jorgebucaran/fisher/main/functions/fisher.fish | source && fisher install jorgebucaran/fisher",
        )
      }

      if (diff.removed.length > 0) {
        for (const plugin of diff.removed) await runFishCmd(`fisher remove ${plugin}`)
      }
      if (diff.added.length > 0) {
        for (const plugin of diff.added) await runFishCmd(`fisher install ${plugin}`)
      }
    },
    update: () => {
      return
    },
  },
)

export { fisher }
