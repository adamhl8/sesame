import process from "node:process"
import { type } from "arktype"
import type { Result } from "ts-explicit-errors"
import { err, errWithCtx, isErr } from "ts-explicit-errors"

import { parseCliArgs } from "~/core/cli.ts"
import type { SesameConfig } from "~/core/config/schema.ts"
import type { ValidatedConfig } from "~/core/config/validator.ts"
import { validateConfig } from "~/core/config/validator.ts"
import { ClackLogger } from "~/core/logger.ts"
import { handlePlugin } from "~/core/plugin-handler.ts"

const hostContextSchema = type({
  host: "string",
  user: "string",
  arch: "string",
  os: "string",
})
type HostContext = typeof hostContextSchema.infer

const pluginContextSchema = type({
  hostCtx: hostContextSchema,
  logger: type.instanceOf(ClackLogger),
  sudo: {
    raw: "string",
  },
})
export type PluginContext = typeof pluginContextSchema.infer

function getHostData(config: ValidatedConfig, host: string) {
  const hostContext = hostContextSchema({
    host,
    user: "",
    arch: process.arch,
    os: process.platform,
  })
  if (hostContext instanceof type.errors) return err(hostContext.summary, undefined)

  const plugins = config[host]?.plugins ?? []

  return { hostContext, plugins }
}

function getPluginContext(hostContext: HostContext, pluginLogger: ClackLogger) {
  const pluginContext = pluginContextSchema({
    hostCtx: hostContext,
    logger: pluginLogger,
    sudo: {
      raw: "",
    },
  })
  if (pluginContext instanceof type.errors) return err(pluginContext.summary, undefined)

  return pluginContext
}

/**
 * @param sesameConfig wip
 * @param logger wip
 * @returns `void`
 */
export async function main(sesameConfig: SesameConfig, logger: ClackLogger): Promise<Result> {
  const config = validateConfig(sesameConfig)
  if (isErr(config)) return err("invalid config", config)

  const cliArgs = parseCliArgs(config)
  if (isErr(cliArgs)) return err("failed to parse CLI args", cliArgs)

  const { hosts } = cliArgs

  logger.intro(`Running for hosts: ${hosts.join(", ")}`)

  for (const host of hosts) {
    const hostErr = errWithCtx({ logScope: host })
    const hostLogger = logger.scope(host)

    hostLogger.start("")

    const hostData = getHostData(config, host)
    if (isErr(hostData)) return hostErr("failed to build host context", hostData)
    const { hostContext, plugins } = hostData

    for (const plugin of plugins) {
      const pluginLogger = hostLogger.scope(plugin.details.name)
      const pluginContext = getPluginContext(hostContext, pluginLogger)
      if (isErr(pluginContext)) return hostErr("failed to build plugin context", pluginContext)

      const handlePluginResult = await handlePlugin(plugin, pluginContext)
      if (isErr(handlePluginResult)) return hostErr("failed to run plugin", handlePluginResult)
    }

    hostLogger.success("")
  }

  logger.success("Done!")
}
