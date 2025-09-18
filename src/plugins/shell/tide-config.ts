import { PluginBuilder } from "@/core/plugin/builder.ts"
import { runFishCmd } from "~/plugins/lib/lib.ts"

const tideConfig = PluginBuilder.new<string>({ name: "Tide Config", printDiff: false })
  .diff<true>((_, previous, configString) => (previous !== configString ? true : undefined))
  .handle(async (_, __, input) => {
    console.info("Configuring tide...")
    await runFishCmd(`echo ${input} y | tide configure`).quiet()
  })
  .build()

export { tideConfig }
