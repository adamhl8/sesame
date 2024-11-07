import { requestRestart } from "@/lib.ts"
import { createPlugin } from "@/plugin.ts"
import { $ } from "bun"

const installHomebrew = createPlugin<null, true>(
  { name: "Homebrew" },
  {
    diff: () => (Bun.which("brew") ? undefined : true),
    handle: async (ctx) => {
      ctx.logger.info("Installing Homebrew...")
      await $`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
      requestRestart(
        ctx.logger,
        "Due to an issue with Bun, it's not possible to make updates to PATH in the current session. Please restart bun-infra.",
      )
    },
    update: () => {
      return
    },
  },
)

export { installHomebrew }
