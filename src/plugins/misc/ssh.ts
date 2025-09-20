import { $ } from "bun"

import { PluginBuilder } from "~/core/plugin/builder.ts"
import { getSopsSecret } from "~/plugins/lib/lib"

const ssh = PluginBuilder.new<null>({ name: "SSH" })
  .diff<true>((_, previous) => (previous === null ? undefined : true))
  .handle(async (ctx) => {
    $`mkdir -p ~/.ssh/`
    await $`chmod 700 ~/.ssh/`
    const privateKey = await getSopsSecret(`${ctx.hostCtx.host}.pri`)
    const publicKey = await getSopsSecret(`${ctx.hostCtx.host}.pub`)
    await $`echo "${privateKey}" >~/.ssh/id_ed25519`
    await $`echo "${publicKey}" >~/.ssh/id_ed25519.pub`
    await $`chmod 600 ~/.ssh/id_ed25519`
    await $`chmod 644 ~/.ssh/id_ed25519.pub`
  })
  .build()

export { ssh }
