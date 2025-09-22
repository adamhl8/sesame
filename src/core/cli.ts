import { cli } from "cleye"
import type { Result } from "ts-explicit-errors"
import { err } from "ts-explicit-errors"

import type { SesameConfig } from "~/core/config/schema.ts"

interface CliArgs {
  hosts: string[]
}

/**
 * @returns CLI args
 */
export function getArgv() {
  return cli({
    name: "sesame",
    parameters: ["<host...>"],
  })
}

/**
 * @param config temp
 * @returns validated config
 */
export function parseCliArgs(config: SesameConfig): Result<CliArgs> {
  const argv = getArgv()

  const hosts = argv._.host

  for (const host of hosts) {
    if (!Object.hasOwn(config, host)) {
      return err(`host '${host}' not found in config`, undefined)
    }
  }

  const cliArgs: CliArgs = { hosts }

  return cliArgs
}
