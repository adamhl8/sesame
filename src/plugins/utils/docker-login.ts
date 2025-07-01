import { getSopsSecret } from "@/plugins/lib/lib"
import { createPlugin } from "@/plugin.ts"
import { $ } from "bun"

interface DockerLogin {
  registry?: string
  username: string
  sopsPasswordKey: string
}

const dockerLogin = createPlugin<DockerLogin, true>(
  { name: "Docker Login" },
  {
    diff: (_, previous) => (previous ? undefined : true),
    handle: async (_, __, input) => {
      const password = await getSopsSecret(input.sopsPasswordKey)
      const registry = input.registry ? `${input.registry} ` : ""
      await $`echo '${{ raw: password }}' | docker login ${{ raw: registry }}--username ${{ raw: input.username }} --password-stdin`
    },
  },
)

export { dockerLogin }
