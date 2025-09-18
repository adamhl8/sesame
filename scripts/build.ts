import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import type { Result } from "ts-explicit-errors"
import { attempt, err, isErr } from "ts-explicit-errors"

const SRC_DIR = "src"
const DIST_DIR = "dist"

const IMPORT_REGEX = /from\s+["']@\/(.*?)["']/g

async function transformImports(filePath: string): Promise<Result> {
  const content = await attempt(() => Bun.file(filePath).text())
  if (isErr(content)) return err(`failed to read file: ${filePath}`, content)

  // Let's say filePath is "dist/plugins/programs/brew-casks.ts"
  // path.dirname("dist/plugins/programs/brew-casks.ts") is "dist/plugins/programs"
  // from "dist/plugins/programs" to "dist" would be going up two directories
  const relativePath = path.relative(path.dirname(filePath), DIST_DIR)
  // relativePath is "../.."

  let transformed: string

  if (relativePath === "") {
    // If relativePath is empty, we're at the root of dist
    // For imports from the root of dist, we just need to replace "@/" with "./"
    transformed = content.replace(IMPORT_REGEX, (_, importPath: string) => `from "./${importPath}"`)
  } else {
    // Replace @/* imports with relative paths
    transformed = content.replace(IMPORT_REGEX, (_, importPath: string) => {
      // importPath would be something like "plugin.ts" (which had the "@/" prefix removed)
      // joining "../.." and "plugin.ts"
      const joinedPath = path.join(relativePath, importPath)
      // joinedPath is "../../plugin.ts", which is equivalent to "@/plugin.ts"

      return `from "${joinedPath}"`
    })
  }

  const writeResult = await attempt(() => Bun.write(filePath, transformed))
  if (isErr(writeResult)) return err(`failed to write file: ${filePath}`, writeResult)
}

async function getTsFilePaths(): Promise<Result<string[]>> {
  const glob = new Bun.Glob(`${DIST_DIR}/**/*.ts`)
  const filePaths = await attempt(() => Array.fromAsync(glob.scan()))
  if (isErr(filePaths)) return err("failed to glob dist *.ts file paths", filePaths)

  return filePaths
}

async function build(): Promise<Result> {
  const rmResult = await attempt(() => fs.rm(DIST_DIR, { recursive: true, force: true }))
  if (rmResult) return err("failed to clean dist directory", rmResult)

  const copyResult = await attempt(() => fs.cp(SRC_DIR, DIST_DIR, { recursive: true }))
  if (copyResult) return err("failed to copy src to dist", copyResult)

  const tsFilePaths = await getTsFilePaths()
  if (isErr(tsFilePaths)) return err("failed to get file paths", tsFilePaths)

  for (const filePath of tsFilePaths) {
    const transformResult = await transformImports(filePath)
    if (isErr(transformResult)) return err(`failed to transform imports in: ${filePath}`, transformResult)
  }
}

const result = await build()
if (isErr(result)) {
  console.error(`build failed: ${result.messageChain}`)
  process.exit(1)
}
