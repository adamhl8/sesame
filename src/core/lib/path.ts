import * as os from "node:os"
import * as nodePath from "node:path"
import { $ } from "bun"

const TILDE_REGEX = /^~(?=$|\/|\\)/
const HOME_DIR = os.homedir()

function untildify(pathWithTilde: string) {
  return HOME_DIR ? pathWithTilde.replace(TILDE_REGEX, HOME_DIR) : pathWithTilde
}

async function resolveEnvVars(path: string) {
  return (await $`echo "${{ raw: path }}"`.quiet().text()).trim()
}

async function resolvePath(path: string) {
  let newPath = path.trim()

  // We want to keep trailing slashes that nodePath.resolve() will remove
  const hasTrailingSlash = newPath.endsWith("/")

  newPath = untildify(newPath)
  newPath = await resolveEnvVars(newPath)
  newPath = nodePath.resolve(newPath)
  newPath = newPath !== "/" && hasTrailingSlash ? `${newPath}/` : newPath

  return newPath
}

export { resolvePath }
