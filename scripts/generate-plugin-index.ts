import path from "node:path"
import process from "node:process"
import type { Result } from "ts-explicit-errors"
import { attempt, err, isErr } from "ts-explicit-errors"

const PLUGINS_DIR = "src/plugins"
const PLUGIN_INDEX_FILE = "src/plugins/index.ts"

function kebabToCamel(str: string): Result<string> {
  const camelStr = attempt(() =>
    str.replace(/-./g, (x) => {
      const letter = x[1]
      if (!letter) throw new Error(`invalid kebab case string: ${str}`)
      return letter.toUpperCase()
    }),
  )
  return camelStr
}

async function getPluginFilePaths(): Promise<string[]> {
  const glob = new Bun.Glob("**/*.ts")
  const pluginFilePaths = await Array.fromAsync(glob.scan({ cwd: PLUGINS_DIR }))

  return pluginFilePaths.filter((pluginFilePath) => {
    if (pluginFilePath === "index.ts") return false
    if (pluginFilePath.startsWith("lib/")) return false
    return true
  })
}

async function generatePluginIndex(): Promise<Result> {
  const pluginFilePaths = await attempt(getPluginFilePaths)
  if (isErr(pluginFilePaths)) return err("failed to get plugin file names", pluginFilePaths)

  const exports: string[] = []
  for (const pluginFilePath of pluginFilePaths) {
    const pluginFileName = path.basename(pluginFilePath, ".ts")
    const camelPluginFileName = kebabToCamel(pluginFileName)
    if (isErr(camelPluginFileName)) return err("failed to convert plugin name to camel case", camelPluginFileName)

    exports.push(`export { ${camelPluginFileName} } from "./${pluginFilePath}"`)
  }

  const writeResult = await attempt(() => Bun.write(PLUGIN_INDEX_FILE, `${exports.join("\n")}\n`))
  if (isErr(writeResult)) return err("failed to write plugin index file", writeResult)
}

const generatePluginIndexResult = await generatePluginIndex()
if (isErr(generatePluginIndexResult)) {
  console.error(`failed to generate plugin index: ${generatePluginIndexResult.messageChain}`)
  process.exit(1)
}
