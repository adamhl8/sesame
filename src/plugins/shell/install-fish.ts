import { $ } from "bun"

import { PluginBuilder } from "@/core/plugin/builder.ts"

const installFish = PluginBuilder.new<null>({ name: "Install Fish", printDiff: false })
  .diff<true>(() => (Bun.which("fish") ? undefined : true))
  .handle(async () => {
    console.info("Fish is not installed. Installing...")
    await $`brew install fish`
    await $`mkdir -p ~/.config/fish/conf.d/`
    await $`$HOMEBREW_PREFIX/bin/brew shellenv fish >~/.config/fish/conf.d/homebrew.fish`
  })
  .update(() => {
    return
  })
  .build()

export { installFish }
