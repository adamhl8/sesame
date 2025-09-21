import process from "node:process"
import { $ } from "bun"

import { resolvePath } from "~/core/lib/path.ts"
import type { ClackLogger } from "~/core/logger.ts"

async function getSopsSecret(pathString: string) {
  const keys = pathString.split(".").join("']['")
  return (await $`sops -d --extract "['${{ raw: keys }}']" ${resolvePath("./configs/secrets.yaml")}`.quiet())
    .text()
    .trim()
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

function requestRestart(logger: ClackLogger, message: string) {
  logger.warn(message)
  process.exit(EX_TEMPFAIL)
}

// async function sudo(host: string) {
//   const sudoPassword = await getSopsSecret(`sesame.${host}.sudo_password`)
//   return { raw: `echo ${sudoPassword} | sudo -S -p '' --` }
// }

export async function installAppFromZip(downloadUrl: string) {
  const zipPath = await resolvePath("~/tmp_hl_download.zip")
  await $`curl -Lo ${zipPath} ${downloadUrl}`.quiet()
  await $`unzip -o -q ${zipPath} -d /Applications/`.quiet()
  await $`rm ${zipPath}`.quiet()
}

function runFishCmd(cmd: string) {
  return $`fish -l -c ${cmd}`
}

export { getAddedRemovedDiff, requestRestart, getSopsSecret, runFishCmd }
