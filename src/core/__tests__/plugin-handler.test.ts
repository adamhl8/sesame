import { afterAll, beforeAll, describe, expect, jest, mock, spyOn, test } from "bun:test"
import { PluginBuilder } from "../plugin/builder.ts"
import { expectErr, expectNotErr } from "@/__tests__/utils.ts"
import { getDiff, getInput } from "../plugin-handler.ts"
import type { JsonValue } from "type-fest"
import { expectTypeOf } from "expect-type"
import type { PluginContext } from "../main.ts"
import { db } from "@/core/state-db.ts"
import type { PluginInstance } from "../config/schema.ts"

describe("plugin-handler", () => {
  describe("getInput", () => {
    test("returns expected error when plugin.input() throws", async () => {
      const plugin = PluginBuilder.new({ name: "pluginName" }).build()
      const pluginInstance = plugin()
      pluginInstance.input = () => {
        throw new Error("input error")
      }

      const input = await getInput(pluginInstance)
      expectErr(input)

      expect(input.fmtErr()).toBe("input error")
    })

    test("returns expected error when plugin.transform() throws", async () => {
      const plugin = PluginBuilder.new({ name: "pluginName" })
        .transform(() => {
          throw new Error("transform error")
        })
        .build()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const pluginInstance = plugin() as unknown as PluginInstance

      const input = await getInput(pluginInstance)
      expectErr(input)

      expect(input.fmtErr()).toBe("transform error")
    })

    test("returns expected error when input is not valid JSON", async () => {
      const plugin = PluginBuilder.new<Map<string, string>>({ name: "pluginName" }).build()
      const pluginInstance = plugin(new Map())

      const input = await getInput(pluginInstance)
      expectErr(input)

      expect(input.fmtErr()).toBe("input is not valid JSON")
    })

    test("converts undefined input to null", async () => {
      const plugin = PluginBuilder.new({ name: "pluginName" }).build()
      const pluginInstance = plugin()

      const input = await getInput(pluginInstance)
      expectNotErr(input)

      expect(input).toBeNull()
    })

    test("returns input as JsonValue", async () => {
      const plugin = PluginBuilder.new<string>({ name: "pluginName" }).build()
      const pluginInstance = plugin("foo")
      const input = await getInput(pluginInstance)

      expectNotErr(input)

      expectTypeOf(input).toExtend<JsonValue>()

      expect(input).toEqual("foo")
    })
  })

  describe("getDiff", () => {
    beforeAll(() => {
      spyOn(db, "get").mockImplementation(() => void 0)
    })

    afterAll(() => {
      mock.restore()
    })

    test("returns expected error when plugin.diff is undefined", async () => {
      const plugin = PluginBuilder.new({ name: "pluginName" }).build()
      const pluginInstance = plugin()

      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const diff = await getDiff(pluginInstance, { hostCtx: { host: "foo" } } as PluginContext, {})

      expectErr(diff)

      expect(diff.fmtErr()).toBe("diff function is undefined")
    })

    test("returns expected error when plugin.diff() throws", async () => {
      const plugin = PluginBuilder.new({ name: "pluginName" })
        .diff(() => {
          throw new Error("diff error")
        })
        .build()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const pluginInstance = plugin() as unknown as PluginInstance

      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const diff = await getDiff(pluginInstance, { hostCtx: { host: "foo" } } as PluginContext, {})
      expectErr(diff)

      expect(diff.fmtErr()).toBe("diff error")
    })

    test("returns diff", async () => {
      const plugin = PluginBuilder.new({ name: "pluginName" })
        .diff(() => "diff")
        .build()
      const pluginInstance = plugin()

      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const diff = await getDiff(pluginInstance, { hostCtx: { host: "foo" } } as PluginContext, {})
      expectNotErr(diff)

      expect(diff).toBe("diff")
    })
  })
})
