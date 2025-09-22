import { $ } from "bun"

import { PluginBuilder } from "~/core/plugin/builder.ts"

export const fnm = PluginBuilder.new<null>({ name: "fnm" })
  .diff<true>((_, previous) => (previous === null ? undefined : true))
  .handle(async () => {
    await $`fnm install --latest`
    await $`npm install -g npm`
  })
  .update(() => {
    return
  })
  .build()
