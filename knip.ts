import { knipConfig } from "@adamhl8/configs"

const config = knipConfig({ entry: ["./src/plugins/index.ts"], ignoreBinaries: [/.*/] } as const)

export default config
