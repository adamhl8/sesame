import { type ArkErrors, type } from "arktype"
import { sesameConfigSchema, type SesameConfig } from "@/core/config/schema.ts"
import { err, type Result } from "ts-explicit-errors"
import type { Tagged } from "type-fest"

function isArkErrors(value: unknown): value is ArkErrors {
  return value instanceof type.errors
}

type ValidatedConfig = Tagged<SesameConfig, "validated">

/**
 * @param config temp
 * @returns validated config
 */
function validateConfig(config: SesameConfig): Result<ValidatedConfig> {
  const validatedConfig = sesameConfigSchema(config)
  if (isArkErrors(validatedConfig)) {
    const errorMessages = validatedConfig.summary
      .split("\n")
      .filter(Boolean)
      .map((errorMessage) => prependPluginValidationErrorWithPluginName(errorMessage, config))

    const isMultilineError = errorMessages.length > 1
    const joinedErrorMessages = errorMessages.join("\n")
    const errorSummary = isMultilineError ? `\n${joinedErrorMessages}` : joinedErrorMessages

    return err(errorSummary)
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return validatedConfig as ValidatedConfig
}

function prependPluginValidationErrorWithPluginName(errorMessage: string, config: SesameConfig) {
  // We are working with something like: host1.plugins[0].diff must be a function (was string)
  const pluginMatch = /^(?<host>[^.]+)\.plugins\[(?<index>\d+)\]/v.exec(errorMessage)
  if (!pluginMatch?.groups) return errorMessage

  const { host, index } = pluginMatch.groups
  if (!(host && index)) return errorMessage

  const pluginName = config[host]?.plugins[Number.parseInt(index)]?.details.name
  if (!pluginName) return errorMessage

  return `(${pluginName}) ${errorMessage}`
}

export { validateConfig }
export type { ValidatedConfig }
