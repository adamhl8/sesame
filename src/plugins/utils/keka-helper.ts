import { createPlugin } from "@/plugin.ts"
import type { HostContext } from "@/types.ts"
import { installAppFromZip } from "@/core/lib/utils"
import { $ } from "bun"

async function useKekaHelper(ctx: HostContext) {
  await installAppFromZip("https://d.keka.io/helper")
  ctx.logger.info("Setting Keka as default...")
  await $`/Applications/KekaExternalHelper.app/Contents/MacOS/KekaExternalHelper --set-as-default`.quiet()
  await $`rm -rf /Applications/KekaExternalHelper.app`.quiet()
}

const kekaHelper = createPlugin<null, true>(
  { name: "Keka Helper" },
  {
    diff: (_, previous) => (previous === null ? undefined : true),
    handle: useKekaHelper,
    update: useKekaHelper,
  },
)

export { kekaHelper }
