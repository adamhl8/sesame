import os from "node:os"
import nodePath from "node:path"
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
  path = path.trim()

  // We want to keep trailing slashes that nodePath.resolve() will remove
  const hasTrailingSlash = path.endsWith("/")

  path = untildify(path)
  path = await resolveEnvVars(path)
  path = nodePath.resolve(path)
  path = path !== "/" && hasTrailingSlash ? `${path}/` : path

  return path
}

export { resolvePath }
