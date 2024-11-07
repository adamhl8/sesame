import { resolvePath } from "@/lib.ts"
import { $ } from "bun"

async function installAppFromZip(downloadUrl: string) {
  const zipPath = await resolvePath("~/tmp_hl_download.zip")
  await $`curl -Lo ${zipPath} ${downloadUrl}`.quiet()
  await $`unzip -o -q ${zipPath} -d /Applications/`.quiet()
  await $`rm ${zipPath}`.quiet()
}

function runFishCmd(cmd: string) {
  return $`fish -l -c ${cmd}`
}

export { installAppFromZip, runFishCmd }
