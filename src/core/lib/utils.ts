import { resolvePath } from "@/core/lib/path"
import { $ } from "bun"
import util from "node:util"

function stringify(value: unknown) {
  return util.inspect(value, { depth: null, colors: true, maxArrayLength: null, maxStringLength: null })
}

export { installAppFromZip, runFishCmd, stringify }
