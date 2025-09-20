import { $ } from "bun"

import type { PluginContext } from "~/core/main.ts"
import { PluginBuilder } from "~/core/plugin/builder.ts"
import { installAppFromZip } from "~/plugins/lib/lib.ts"

async function useKekaHelper(ctx: PluginContext) {
  await installAppFromZip("https://d.keka.io/helper")
  ctx.logger.info("Setting Keka as default...")
  await $`/Applications/KekaExternalHelper.app/Contents/MacOS/KekaExternalHelper --set-as-default`.quiet()
  await $`rm -rf /Applications/KekaExternalHelper.app`.quiet()
}

const kekaHelper = PluginBuilder.new<null>({ name: "Keka Helper" })
  .diff<true>((_, previous) => (previous === null ? undefined : true))
  .handle(useKekaHelper)
  .update(useKekaHelper)
  .build()

export { kekaHelper }
