import { afterEach, beforeEach, describe, expect, jest, spyOn, test, type Mock } from "bun:test"
import { bootstrap } from "@/core/bootstrap.ts"
import { err, isErr, type CtxError, type Result } from "ts-explicit-errors"
import fs from "node:fs/promises"
import { main } from "@/core/main.ts"
import { ClackLogger } from "../logger.ts"
import { PluginBuilder } from "../plugin/builder.ts"
import * as cli from "@/core/cli.ts"
import * as validator from "@/core/config/validator.ts"

function createMockLogger() {
  return {
    intro: jest.fn(),
    outro: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    diff: jest.fn(),
    noDiff: jest.fn(),
    start: jest.fn(),
    scope: jest.fn(),
  }
}

function expectErr<T>(result: Result<T>): asserts result is CtxError {
  expect(isErr(result)).toBe(true)
}

const logger = new ClackLogger()

describe("main", () => {
  test("returns expected error when config is invalid", async () => {
    const config = {}

    const error = await main(config, logger)
    expectErr(error)

    expect(error.fmtErr()).toStartWith("invalid config")
  })

  test("returns expected error when CLI args are invalid", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    spyOn(validator, "validateConfig").mockImplementation(() => void 0 as never)
    spyOn(cli, "parseCliArgs").mockImplementation(() => err("parseCliArgs error"))

    const error = await main({}, logger)
    expectErr(error)

    expect(error.fmtErr()).toBe("failed to parse CLI args -> parseCliArgs error")
  })

  test("logs intro message", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    spyOn(validator, "validateConfig").mockImplementation(() => void 0 as never)
    spyOn(cli, "parseCliArgs").mockImplementation(() => ({ hosts: ["host1", "host2"] }))

    const introSpy = spyOn(ClackLogger.prototype, "intro").mockImplementation(() => void 0)
    spyOn(ClackLogger.prototype, "start").mockImplementation(() => void 0)

    await main({}, logger)

    expect(introSpy).toHaveBeenCalledWith("Running for hosts: host1, host2")
  })
})
