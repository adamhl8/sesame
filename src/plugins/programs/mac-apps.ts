import { $ } from "bun"

import { PluginBuilder } from "~/core/plugin/builder.ts"
import { getAddedRemovedDiff } from "~/plugins/lib/lib.ts"

type AppInfo = readonly [string, string]

interface macAppsChange {
  added: AppInfo[]
  removed: AppInfo[]
}

const appIdSplit = /\s+/

// executing application must have permissions to manage apps

export const macApps = PluginBuilder.new<string[]>({ name: "Mac Apps" })
  .diff<macAppsChange>(async (_, __, appIds) => {
    const current = (await $`mas list`.quiet())
      .text()
      .trim()
      .split("\n")
      .map((line) => line.split(appIdSplit)[0] ?? "")

    const diff = getAddedRemovedDiff(appIds, current)
    if (!diff) return

    const getAppName = async (appId: string) => (await $`mas info ${appId}`.quiet()).text().trim().split("\n")[0] ?? ""

    const addedAppsPromises = diff.added.map(async (appId) => [await getAppName(appId), appId] as const)
    const removedAppsPromises = diff.removed.map(async (appId) => [await getAppName(appId), appId] as const)
    const [addedApps, removedApps] = await Promise.all([
      Promise.all(addedAppsPromises),
      Promise.all(removedAppsPromises),
    ])
    return { added: addedApps, removed: removedApps }
  })
  .handle(async (_, diff) => {
    if (diff.removed.length > 0) {
      for (const [, appId] of diff.removed) await $`sudo mas uninstall ${appId}`
    }
    if (diff.added.length > 0) {
      for (const [, appId] of diff.added) await $`mas install ${appId}`
    }
  })
  .update(async () => {
    await $`mas upgrade`
  })
  .build()
