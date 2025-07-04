import { createPlugin } from "@/plugin.ts"
import { runFishCmd } from "@/core/lib/utils"

const tideConfig = createPlugin<string, true>(
  { name: "Tide Config", printDiff: false },
  {
    diff: (_, previous, configString) => (previous !== configString ? true : undefined),
    handle: async (_, __, input) => {
      console.info("Configuring tide...")
      await runFishCmd(`echo ${input} y | tide configure`).quiet()
    },
  },
)

export { tideConfig }
