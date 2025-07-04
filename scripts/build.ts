import fs from "node:fs/promises"
import path from "node:path"
import { type Err, type Result, attempt, fmtError } from "ts-error-tuple"

const SRC_DIR = "src"
const DIST_DIR = "dist"

const IMPORT_REGEX = /from\s+["']@\/(.*?)["']/g

async function transformImports(filePath: string): Promise<Err> {
  const [content, readErr] = await attempt(() => Bun.file(filePath).text())
  if (readErr) return fmtError(`failed to read file: ${filePath}`, readErr)

  // Let's say filePath is "dist/plugins/programs/brew-casks.ts"
  // path.dirname("dist/plugins/programs/brew-casks.ts") is "dist/plugins/programs"
  // from "dist/plugins/programs" to "dist" would be going up two directories
  const relativePath = path.relative(path.dirname(filePath), DIST_DIR)
  // relativePath is "../.."

  let transformed: string

  if (relativePath === "") {
    // If relativePath is empty, we're at the root of dist
    // For imports from the root of dist, we just need to replace "@/" with "./"
    transformed = content.replace(IMPORT_REGEX, (_, importPath: string) => {
      return `from "./${importPath}"`
    })
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

  const [, writeErr] = await attempt(() => Bun.write(filePath, transformed))
  if (writeErr) return fmtError(`failed to write file: ${filePath}`, writeErr)
}

async function getTsFilePaths(): Promise<Result<string[]>> {
  const glob = new Bun.Glob(`${DIST_DIR}/**/*.ts`)
  const [filePaths, globErr] = await attempt(() => Array.fromAsync(glob.scan()))
  if (globErr) return [undefined, fmtError("failed to glob dist *.ts file paths", globErr)]

  return [filePaths, undefined]
}

async function build(): Promise<Err> {
  const [, rmErr] = await attempt(() => fs.rm(DIST_DIR, { recursive: true, force: true }))
  if (rmErr) return fmtError("failed to clean dist directory", rmErr)

  const [, copyErr] = await attempt(() => fs.cp(SRC_DIR, DIST_DIR, { recursive: true }))
  if (copyErr) return fmtError("failed to copy src to dist", copyErr)

  const [tsFilePaths, tsFilePathsErr] = await getTsFilePaths()
  if (tsFilePathsErr) return fmtError("failed to get file paths", tsFilePathsErr)

  for (const filePath of tsFilePaths) {
    const err = await transformImports(filePath)
    if (err) return fmtError(`failed to transform imports in: ${filePath}`, err)
  }
}

const err = await build()
if (err) {
  console.error(fmtError("build failed", err).message)
  process.exit(1)
}
