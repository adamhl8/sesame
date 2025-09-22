import type { ArkErrors } from "arktype"
import { type } from "arktype"
import type { Result } from "ts-explicit-errors"
import { err } from "ts-explicit-errors"
import type { Tagged } from "type-fest"

import type { SesameConfig } from "~/core/config/schema.ts"
import { sesameConfigSchema } from "~/core/config/schema.ts"

function isArkErrors(value: unknown): value is ArkErrors {
  return value instanceof type.errors
}

export type ValidatedConfig = Tagged<SesameConfig, "validated">

/**
 * @param config temp
 * @returns validated config
 */
export function validateConfig(config: SesameConfig): Result<ValidatedConfig> {
  const validatedConfig = sesameConfigSchema(config)
  if (isArkErrors(validatedConfig)) {
    const errorMessages = validatedConfig.summary
      .split("\n")
      .filter(Boolean)
      .map((errorMessage) => prependPluginValidationErrorWithPluginName(errorMessage, config))

    const isMultilineError = errorMessages.length > 1
    const joinedErrorMessages = errorMessages.join("\n")
    const errorSummary = isMultilineError ? `\n${joinedErrorMessages}` : joinedErrorMessages

    return err(errorSummary, undefined)
  }

  return validatedConfig as ValidatedConfig
}

const pluginRegex = /^(?<host>[^.]+)\.plugins\[(?<index>\d+)\]/v
function prependPluginValidationErrorWithPluginName(errorMessage: string, config: SesameConfig) {
  // We are working with something like: host1.plugins[0].diff must be a function (was string)
  const pluginMatch = pluginRegex.exec(errorMessage)
  if (!pluginMatch?.groups) return errorMessage

  const { host, index } = pluginMatch.groups
  if (!(host && index)) return errorMessage

  const pluginName = config[host]?.plugins[Number.parseInt(index, 10)]?.details.name
  if (!pluginName) return errorMessage

  return `(${pluginName}) ${errorMessage}`
}
