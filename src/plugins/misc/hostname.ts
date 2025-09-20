import { $ } from "bun"

import { PluginBuilder } from "~/core/plugin/builder.ts"

interface HostnameDiff {
  hostname?: { old: string; new: string }
  localHostname?: { old: string; new: string }
}

const hostname = PluginBuilder.new<string>({ name: "hostname" })
  .diff<HostnameDiff>(async (ctx, _previous, newHostname) => {
    if (ctx.hostCtx.os === "darwin") {
      const { sudo } = ctx
      const currentHostname = (await $`${sudo} scutil --get HostName`.quiet().nothrow()).text().trim()
      const currentLocalHostname = (await $`${sudo} scutil --get LocalHostName`.quiet().nothrow()).text().trim()
      const diff: HostnameDiff = {}
      if (currentHostname !== newHostname) diff.hostname = { old: currentHostname, new: newHostname }
      if (currentLocalHostname !== newHostname) diff.localHostname = { old: currentLocalHostname, new: newHostname }
      if (Object.keys(diff).length === 0) return
      return diff
    }
    return
  })
  .handle(async (ctx, diff) => {
    if (ctx.hostCtx.os === "darwin") {
      const { sudo } = ctx
      if (diff.hostname) await $`${sudo} scutil --set HostName ${diff.hostname.new}`
      if (diff.localHostname) await $`${sudo} scutil --set LocalHostname ${diff.localHostname.new}`
    }
  })
  .build()

export { hostname }
