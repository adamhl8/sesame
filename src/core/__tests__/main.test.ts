import { describe, expect, spyOn, test } from "bun:test"
import { err } from "ts-explicit-errors"

import { expectErr } from "~/__tests__/utils"
import * as cli from "~/core/cli.ts"
import * as validator from "~/core/config/validator.ts"
import { ClackLogger } from "~/core/logger.ts"
import { main } from "~/core/main.ts"

const logger = new ClackLogger()

describe("main", () => {
  test("returns expected error when config is invalid", async () => {
    const config = {}

    const error = await main(config, logger)
    expectErr(error)

    expect(error.messageChain).toStartWith("invalid config")
  })

  test("returns expected error when CLI args are invalid", async () => {
    spyOn(validator, "validateConfig").mockImplementation(() => void 0 as never)
    spyOn(cli, "parseCliArgs").mockImplementation(() => err("parseCliArgs error", undefined))

    const error = await main({}, logger)
    expectErr(error)

    expect(error.messageChain).toBe("failed to parse CLI args -> parseCliArgs error")
  })

  test("logs intro message", async () => {
    spyOn(validator, "validateConfig").mockImplementation(() => void 0 as never)
    spyOn(cli, "parseCliArgs").mockImplementation(() => ({ hosts: ["host1", "host2"] }))

    const introSpy = spyOn(ClackLogger.prototype, "intro").mockImplementation(() => void 0)
    spyOn(ClackLogger.prototype, "start").mockImplementation(() => void 0)

    await main({}, logger)

    expect(introSpy).toHaveBeenCalledWith("Running for hosts: host1, host2")
  })
})
