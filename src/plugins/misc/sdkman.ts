import { $ } from "bun"

import { PluginBuilder } from "~/core/plugin/builder.ts"

const sdkman = PluginBuilder.new<null>({ name: "Install sdkman" })
  .diff<true>((_, previous) => (previous === null ? undefined : true))
  .handle(async () => {
    await $`curl -s 'https://get.sdkman.io?rcupdate=false' | bash`
  })
  .update(() => {
    return
  })
  .build()

export { sdkman }
