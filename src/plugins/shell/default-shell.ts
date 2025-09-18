import { $ } from "bun"

import { resolvePath } from "@/core/lib/path"
import { PluginBuilder } from "@/core/plugin/builder.ts"

interface DefaultShellDiff {
  addShell?: boolean
  changeShell?: boolean
}

const defaultShell = PluginBuilder.new<string>({ name: "Default Shell", printDiff: false })
  .transform(resolvePath)
  .diff<DefaultShellDiff>(async (_, previous, shellPath) => {
    const changes: DefaultShellDiff = {}

    const result = await $`grep -q ${shellPath} /etc/shells`.nothrow()
    if (result.exitCode !== 0) changes.addShell = true

    if (!previous || previous !== shellPath || changes.addShell) changes.changeShell = true

    if (Object.keys(changes).length === 0) return
    return changes
  })
  .handle(async (ctx, diff, shellPath) => {
    if (diff.addShell) {
      await $`echo ${shellPath} | sudo tee -a /etc/shells >/dev/null`
      ctx.logger.info(`Added ${shellPath} to /etc/shells`)
    }

    if (diff.changeShell) await $`chsh -s ${shellPath}`
  })
  .build()

export { defaultShell }
