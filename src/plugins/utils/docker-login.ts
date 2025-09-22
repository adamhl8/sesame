import { $ } from "bun"

import { PluginBuilder } from "~/core/plugin/builder.ts"
import { getSopsSecret } from "~/plugins/lib/lib.ts"

interface DockerLogin {
  registry?: string
  username: string
  sopsPasswordKey: string
}

export const dockerLogin = PluginBuilder.new<DockerLogin>({ name: "Docker Login" })
  .diff<true>((_, previous) => (previous ? undefined : true))
  .handle(async (_, __, input) => {
    const password = await getSopsSecret(input.sopsPasswordKey)
    const registry = input.registry ? `${input.registry} ` : ""
    await $`echo '${{ raw: password }}' | docker login ${{ raw: registry }}--username ${{ raw: input.username }} --password-stdin`
  })
  .build()
