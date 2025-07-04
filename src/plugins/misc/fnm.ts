import { createPlugin } from "@/plugin.ts"
import { $ } from "bun"

const fnm = createPlugin<null, true>(
  { name: "fnm" },
  {
    diff: (_, previous) => (previous === null ? undefined : true),
    handle: async () => {
      await $`fnm install --latest`
      await $`npm install -g npm`
    },
    update: () => {
      return
    },
  },
)

export { fnm }
