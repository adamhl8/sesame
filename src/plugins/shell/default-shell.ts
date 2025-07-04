import { resolvePath } from "@/core/lib/path"
import { createPlugin } from "@/plugin.ts"
import { $ } from "bun"

interface DefaultShellDiff {
  addShell?: boolean
  changeShell?: boolean
}

const defaultShell = createPlugin<string, DefaultShellDiff>(
  { name: "Default Shell", printDiff: false },
  {
    diff: async (_, previous, shellPath) => {
      const changes: DefaultShellDiff = {}

      const result = await $`grep -q ${shellPath} /etc/shells`.nothrow()
      if (result.exitCode !== 0) changes.addShell = true

      if (!previous || previous !== shellPath || changes.addShell) changes.changeShell = true

      if (Object.keys(changes).length === 0) return
      return changes
    },
    handle: async (ctx, diff, shellPath) => {
      if (diff.addShell) {
        await $`echo ${shellPath} | sudo tee -a /etc/shells >/dev/null`
        ctx.logger.info(`Added ${shellPath} to /etc/shells`)
      }

      if (diff.changeShell) await $`chsh -s ${shellPath}`
    },
  },
  resolvePath,
)

export { defaultShell }
