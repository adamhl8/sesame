import { db } from "@/core/state-db.ts"
import { stringify } from "@/core/lib/utils.ts"
import { attempt, err, isErr, errWithCtx, type Result } from "ts-explicit-errors"

import type { PluginInstance } from "@/core/config/schema.ts"
import type { JsonValue } from "type-fest"
import type { PluginContext } from "@/core/main.ts"

// TODO: replace with arktype json when it's released
function isValidJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true

  if (Array.isArray(value)) return value.every((item) => isValidJsonValue(item))

  if (typeof value === "object") {
    const objectType = Object.prototype.toString.call(value)
    if (objectType !== "[object Object]") return false

    return Object.values(value).every((item) => isValidJsonValue(item))
  }

  return false
}
// const jsonSchema = type("json")

/**
 * @param plugin wip
 * @returns `void`
 */
async function getInput(plugin: PluginInstance): Promise<Result<JsonValue>> {
  let input = await attempt(
    async () => (plugin.transform ? await plugin.transform(plugin.input()) : plugin.input()) as unknown,
  )
  if (isErr(input)) return input
  // if input is nullish, we set it to null because null is a valid JSON value
  // eslint-disable-next-line unicorn/no-null
  input ??= null
  if (!isValidJsonValue(input)) return err("input is not valid JSON")

  return input
}

/**
 * @param plugin wip
 * @param context wip
 * @param input wip
 * @returns `void`
 */
async function getDiff(plugin: PluginInstance, context: PluginContext, input: JsonValue): Promise<Result<unknown>> {
  const { hostCtx } = context
  const { host } = hostCtx

  const previous = db.get(host, plugin.details.name)

  const diff = await attempt(async () => {
    if (!plugin.diff) return err("diff function is undefined")
    return (await plugin.diff(context, previous, input)) as unknown
  })

  return diff
}

/**
 * @param plugin wip
 * @param context wip
 * @returns `void`
 */
async function handlePlugin(plugin: PluginInstance, context: PluginContext): Promise<Result> {
  const { hostCtx, logger } = context
  const { host } = hostCtx

  const pluginErr = errWithCtx({ logScope: plugin.details.name })

  logger.start("")

  const input = await getInput(plugin)
  if (isErr(input)) return pluginErr("failed to get input", input)

  const diff = await getDiff(plugin, context, input)
  if (isErr(diff)) return pluginErr("failed to get diff", diff)
  if (diff === undefined) {
    logger.noDiff("")
    db.set(host, plugin.details.name, input)
    return
  }

  if (plugin.details.printDiff) logger.diff(getDiffString(diff))
  else logger.diff("")

  const shouldContinue = await logger.continue("Apply changes?")
  if (isErr(shouldContinue)) return pluginErr("", shouldContinue)
  if (!shouldContinue) {
    logger.info("skipping plugin")
    return
  }

  if (!plugin.handle) return pluginErr("handle function is undefined")
  await plugin.handle(context, diff, input)

  db.set(host, plugin.details.name, input)

  logger.success("")
}

function getDiffString(diff: unknown) {
  const diffString = stringify(diff)
  const hasMultipleLines = diffString.includes("\n")
  return (hasMultipleLines ? "\n" : "") + diffString
}

export { handlePlugin, getInput, getDiff }
