import { $ } from "bun"

import { PluginBuilder } from "~/core/plugin/builder.ts"

interface DefaultFileViewerDiff {
  fileViewer?: { old: string }
  addHandler?: boolean
}

const defaultFileViewer = PluginBuilder.new<string>({ name: "Default File Viewer", printDiff: false })
  .diff<DefaultFileViewerDiff>(async (_, _previous, bundleId) => {
    const fileViewer = (await $`defaults read -g NSFileViewer`.quiet()).text().trim()

    const lsHandlers =
      await $`defaults read com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers`.quiet()
    const hasHandler = lsHandlers.text().includes(bundleId)

    const diff: DefaultFileViewerDiff = {}
    if (fileViewer !== bundleId) diff.fileViewer = { old: fileViewer }
    if (!hasHandler) diff.addHandler = true
    if (Object.keys(diff).length === 0) return
    return diff
  })
  .handle(async (ctx, diff, input) => {
    if (diff.fileViewer) {
      await $`defaults write -g NSFileViewer -string ${input}`.quiet()
      ctx.logger.info(`Changed default file viewer from ${diff.fileViewer.old} to ${input}`)
    }
    if (diff.addHandler) {
      await $`defaults write com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers -array-add '{LSHandlerContentType="public.folder";LSHandlerRoleAll="${input}";}'`.quiet()
      ctx.logger.info(`Added handler for ${input}`)
    }
  })
  .build()

export { defaultFileViewer }
