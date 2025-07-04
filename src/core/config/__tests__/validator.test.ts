import { describe, expect, test } from "bun:test"
import { validateConfig } from "@/core/config/validator"
import { PluginBuilder } from "@/core/plugin/builder.ts"
import { expectErr } from "@/__tests__/utils.ts"
import type { SesameConfig } from "@/core/config/schema.ts"

describe("validateConfig", () => {
  describe("when config is invalid", () => {
    test("returns error with expected single line message", () => {
      const error = validateConfig({})
      expectErr(error)

      expect(error.fmtErr()).toBe("must be an object of only host config objects (was {})")
    })

    test("returns error with expected multiline message", () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const invalidConfig = {
        host1: { host: 1, user: 1, plugins: [] },
      } as unknown as SesameConfig

      const error = validateConfig(invalidConfig)
      expectErr(error)

      expect(error.fmtErr()).toBe(
        ["", "host1.host must be a string (was a number)", "host1.user must be a string (was a number)"].join("\n"),
      )
    })

    test("prepends plugin validation errors with plugin name", () => {
      const plugin1 = PluginBuilder.new({ name: "plugin1" }).build()
      const plugin2 = PluginBuilder.new({ name: "plugin2" }).build()

      const invalidConfig = {
        host1: { host: "host1", plugins: [plugin1("input"), plugin2("input")] },
      }

      const error = validateConfig(invalidConfig)
      expectErr(error)

      expect(error.fmtErr()).toBe(
        [
          "",
          "(plugin1) host1.plugins[0].diff must be a function (was undefined)",
          "(plugin1) host1.plugins[0].handle must be a function (was undefined)",
          "(plugin2) host1.plugins[1].diff must be a function (was undefined)",
          "(plugin2) host1.plugins[1].handle must be a function (was undefined)",
        ].join("\n"),
      )
    })

    test("returns error with expected message when plugins array is empty", () => {
      const invalidConfig = {
        host1: { host: "host1", plugins: [] },
      }

      const error = validateConfig(invalidConfig)
      expectErr(error)

      expect(error.fmtErr()).toBe("host1.plugins must be non-empty")
    })

    test("returns error with expected message when duplicate plugin names are found", () => {
      const plugin1 = PluginBuilder.new({ name: "plugin1" })
        .diff(() => void 0)
        .handle(() => void 0)
        .build()

      const plugin2 = PluginBuilder.new({ name: "plugin1" })
        .diff(() => void 0)
        .handle(() => void 0)
        .build()

      const invalidConfig = {
        host1: { host: "host1", plugins: [plugin1("input"), plugin2("input")] },
      }

      const error = validateConfig(invalidConfig)
      expectErr(error)

      expect(error.fmtErr()).toBe("duplicate plugin found for host1.plugins: plugin1")
    })
  })
})
