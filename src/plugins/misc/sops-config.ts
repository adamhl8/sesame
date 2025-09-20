import { $ } from "bun"

import { resolvePath } from "~/core/lib/path"
import { PluginBuilder } from "~/core/plugin/builder.ts"

const sopsConfig = PluginBuilder.new<null>({ name: "sops Config" })
  .diff<true>((_, previous) => (previous === null ? undefined : true))
  .handle(async (ctx) => {
    await $`mkdir -p ~/.config/sops/age/`
    ctx.logger.info("Enter key.age passphrase")
    await $`age -o ~/.config/sops/age/keys.txt -d ${await resolvePath("./configs/key.age")}`
    await $`chmod 600 ~/.config/sops/age/keys.txt`
  })
  .build()

export { sopsConfig }
