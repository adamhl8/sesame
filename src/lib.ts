import type { Logger } from "@/logger.ts"
import { $ } from "bun"
import untildify from "untildify"

async function getSopsSecret(pathString: string) {
  const keys = pathString.split(".").join("']['")
  return (await $`sops -d --extract "['${{ raw: keys }}']" ${await resolvePath("./configs/secrets.yaml")}`.quiet())
    .text()
    .trim()
}

async function resolvePath(path: string) {
  const untildified = untildify(path)
  const rawPath = { raw: untildified }
  return (await $`realpath --canonicalize-missing --no-symlinks "${rawPath}"`.quiet().text()).trim()
}

function getAddedRemovedDiff(input: string[], current: string[]) {
  const currentSet = new Set(current)
  const desiredSet = new Set(input)

  const added = input.filter(Boolean).filter((x) => !currentSet.has(x))
  const removed = current.filter(Boolean).filter((x) => !desiredSet.has(x))
  if (added.length === 0 && removed.length === 0) return
  return { added, removed }
}

const EX_TEMPFAIL = 75

function requestRestart(logger: Logger, message: string) {
  logger.warn(message)
  process.exit(EX_TEMPFAIL)
}

async function sudo(host: string) {
  const sudoPassword = await getSopsSecret(`sesame.${host}.sudo_password`)
  return { raw: `echo ${sudoPassword} | sudo -S -p '' --` }
}

export { resolvePath, getAddedRemovedDiff, requestRestart, getSopsSecret, sudo }
