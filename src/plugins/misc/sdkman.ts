import { createPlugin } from "@/plugin.ts"
import { $ } from "bun"

const sdkman = createPlugin<null, true>(
  { name: "Install sdkman" },
  {
    diff: (_, previous) => (previous === null ? undefined : true),
    handle: async () => {
      await $`curl -s 'https://get.sdkman.io?rcupdate=false' | bash`
    },
    update: () => {
      return
    },
  },
)

export { sdkman }
