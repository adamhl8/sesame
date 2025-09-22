import { $ } from "bun"

import { PluginBuilder } from "~/core/plugin/builder.ts"
import { requestRestart } from "~/plugins/lib/lib.ts"

export const installHomebrew = PluginBuilder.new<null>({ name: "Homebrew" })
  .diff<true>(() => (Bun.which("brew") ? undefined : true))
  .handle(async (ctx) => {
    ctx.logger.info("Installing Homebrew...")
    await $`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
    requestRestart(
      ctx.logger,
      "Due to an issue with Bun, it's not possible to make updates to PATH in the current session. Please restart bun-infra.",
    )
  })
  .update(() => {
    return
  })
  .build()
