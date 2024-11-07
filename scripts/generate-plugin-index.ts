import path from "node:path"
import { type Err, type Result, attempt, fmtError } from "ts-error-tuple"

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
  return pluginFilePaths.filter((path) => path !== "index.ts")
}

async function generatePluginIndex(): Promise<Err> {
  const [pluginFilePaths, err] = await attempt(getPluginFilePaths)
  if (err) return fmtError("failed to get plugin file names", err)

  const exports: string[] = []
  for (const pluginFilePath of pluginFilePaths) {
    const pluginFileName = path.basename(pluginFilePath, ".ts")
    const [exportName, err] = kebabToCamel(pluginFileName)
    if (err) return fmtError("failed to convert plugin name to camel case", err)

    exports.push(`export { ${exportName} } from "./${pluginFilePath}"`)
  }

  const [, bunWriteErr] = await attempt(() => Bun.write(PLUGIN_INDEX_FILE, `${exports.join("\n")}\n`))
  if (bunWriteErr) return fmtError("failed to write plugin index file", bunWriteErr)
}

const err = await generatePluginIndex()
if (err) {
  console.error(fmtError("failed to generate plugin index", err).message)
  process.exit(1)
}
