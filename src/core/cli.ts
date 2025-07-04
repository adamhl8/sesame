import { cli } from "cleye"
import type { SesameConfig } from "@/core/config/schema.ts"
import { err, type Result } from "ts-explicit-errors"

interface CliArgs {
  hosts: string[]
}

/**
 * @returns CLI args
 */
function getArgv() {
  return cli({
    name: "sesame",
    parameters: ["<host...>"],
  })
}

/**
 * @param config temp
 * @returns validated config
 */
function parseCliArgs(config: SesameConfig): Result<CliArgs> {
  const argv = getArgv()

  const hosts = argv._.host

  for (const host of hosts) {
    if (!Object.hasOwn(config, host)) {
      return err(`host '${host}' not found in config`)
    }
  }

  const cliArgs: CliArgs = { hosts }

  return cliArgs
}

export { parseCliArgs, getArgv }
