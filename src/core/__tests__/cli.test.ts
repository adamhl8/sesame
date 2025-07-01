import { describe, expect, spyOn, test } from "bun:test"
import { isErr, type CtxError, type Result } from "ts-explicit-errors"
import { getArgv, parseCliArgs } from "@/core/cli.ts"
import type { SesameConfig } from "@/core/config/schema.ts"

function expectErr<T>(result: Result<T>): asserts result is CtxError {
  expect(isErr(result)).toBe(true)
}

function neverFn() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return void 0 as never
}

describe("cli", () => {
  test("calls process.exit with exit status 1 when CLI args are invalid", () => {
    const processExitSpy = spyOn(process, "exit").mockImplementationOnce(neverFn)
    const consoleErrorSpy = spyOn(console, "error").mockImplementationOnce(neverFn)
    spyOn(console, "log").mockImplementationOnce(neverFn)
    getArgv()

    expect(processExitSpy).toHaveBeenCalledWith(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Missing required parameter "host"\n')
  })

  test("returns expected error when host is not found in config", () => {
    const originalArgv = [...process.argv]
    process.argv = ["arg1", "arg2", "invalid-host"]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const config = { "my-host": {} } as unknown as SesameConfig
    const error = parseCliArgs(config)
    expectErr(error)

    expect(error.fmtErr()).toStartWith("host 'invalid-host' not found in config")

    process.argv = originalArgv
  })
})
