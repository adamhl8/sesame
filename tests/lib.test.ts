import { describe, expect, test } from "bun:test"
import * as os from "node:os"
import process from "node:process"

import { resolvePath } from "~/core/lib/path.ts"

describe("resolvePath", () => {
  const homeDir = os.homedir()
  const cwd = process.cwd()

  test("resolves tilde", async () => {
    expect(await resolvePath("~")).toBe(homeDir)
  })

  test("resolves non-existent paths", async () => {
    expect(await resolvePath("~/foo")).toBe(`${homeDir}/foo`)
  })

  test("resolves environment variables", async () => {
    expect(await resolvePath("$HOME")).toBe(homeDir)
    expect(await resolvePath("$HOME/foo")).toBe(`${homeDir}/foo`)
  })

  test("handles spaces", async () => {
    expect(await resolvePath("~/path with spaces")).toBe(`${homeDir}/path with spaces`)
  })

  test("resolves relative paths", async () => {
    expect(await resolvePath(".")).toBe(cwd)
    expect(await resolvePath("./foo")).toBe(`${cwd}/foo`)
    expect(await resolvePath("./foo/..")).toBe(cwd)
    expect(await resolvePath("./foo/../bar")).toBe(`${cwd}/bar`)

    // non-sensical path
    expect(await resolvePath("./foo/.")).toBe(`${cwd}/foo`)
  })

  test("keeps trailing slashes", async () => {
    expect(await resolvePath("./foo/")).toBe(`${cwd}/foo/`)
    expect(await resolvePath("./foo//")).toBe(`${cwd}/foo/`)
    expect(await resolvePath("/")).toBe("/")
    expect(await resolvePath("//")).toBe("/")
  })

  test("all", async () => {
    expect(await resolvePath("~/foo/../bar/$HOME/path with spaces/")).toBe(`${homeDir}/bar${homeDir}/path with spaces/`)
  })
})
