import { createPlugin } from "@/plugin.ts"
import { $ } from "bun"

interface HostnameDiff {
  hostname?: { old: string; new: string }
  localHostname?: { old: string; new: string }
}

const hostname = createPlugin<string, HostnameDiff>(
  { name: "hostname" },
  {
    diff: async (ctx, _previous, hostname) => {
      if (ctx.os === "darwin") {
        const { sudo } = ctx
        const currentHostname = (await $`${sudo} scutil --get HostName`.quiet().nothrow()).text().trim()
        const currentLocalHostname = (await $`${sudo} scutil --get LocalHostName`.quiet().nothrow()).text().trim()
        const diff: HostnameDiff = {}
        if (currentHostname !== hostname) diff.hostname = { old: currentHostname, new: hostname }
        if (currentLocalHostname !== hostname) diff.localHostname = { old: currentLocalHostname, new: hostname }
        if (Object.keys(diff).length === 0) return
        return diff
      }
      return
    },
    handle: async (ctx, diff) => {
      if (ctx.os === "darwin") {
        const { sudo } = ctx
        if (diff.hostname) await $`${sudo} scutil --set HostName ${diff.hostname.new}`
        if (diff.localHostname) await $`${sudo} scutil --set LocalHostName ${diff.localHostname.new}`
      }
    },
  },
)

export { hostname }
