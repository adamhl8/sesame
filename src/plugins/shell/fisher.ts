/** biome-ignore-all lint/performance/noAwaitInLoops: ignore */

import { PluginBuilder } from "~/core/plugin/builder.ts"
import { getAddedRemovedDiff, runFishCmd } from "~/plugins/lib/lib.ts"

interface FisherDiff {
  isFisherInstalled: boolean
  added: string[]
  removed: string[]
}

const fisher = PluginBuilder.new<string[]>({ name: "Fisher Plugins" })
  .diff<FisherDiff>(async (_, _previous, plugins) => {
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
  })
  .handle(async (_, diff) => {
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
  })
  .update(() => {
    return
  })
  .build()

export { fisher }
