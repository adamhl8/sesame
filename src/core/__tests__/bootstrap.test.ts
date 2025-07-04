import { afterEach, describe, expect, test } from "bun:test"
import { bootstrap } from "@/core/bootstrap.ts"
import fs from "node:fs/promises"
import { expectErr } from "@/__tests__/utils.ts"

const BOOTSTRAP_TEST_DIR = import.meta.dir

describe("bootstrap", () => {
  afterEach(async () => {
    await fs.rm(`${BOOTSTRAP_TEST_DIR}/sesame.ts`, { force: true })
    await fs.rm(`${BOOTSTRAP_TEST_DIR}/sesame.txt`, { force: true })
  })

  test("returns expected error when 'sesame.ts' can't be found", async () => {
    const error = await bootstrap()
    expectErr(error)

    expect(error.fmtErr()).toStartWith(
      "failed to compile sesame binary: 'sesame.ts' not found (sesame() must be called from a file named 'sesame.ts') -> error: ModuleNotFound resolving",
    )
  })

  test("builds and runs sesame binary with expected environment variables set", async () => {
    await Bun.write(
      `${BOOTSTRAP_TEST_DIR}/sesame.ts`,
      `await Bun.write("${BOOTSTRAP_TEST_DIR}/sesame.txt", JSON.stringify(Bun.env))`,
    )

    await bootstrap()
    const sesameTsBunEnvJson = await Bun.file(`${BOOTSTRAP_TEST_DIR}/sesame.txt`).text()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const sesameTsBunEnv = JSON.parse(sesameTsBunEnvJson) as typeof Bun.env

    expect(sesameTsBunEnv["SESAME_BOOTSTRAPPED"]).toBe("TRUE")
    expect(sesameTsBunEnv["SESAME_ROOT_DIR"]).toBe(BOOTSTRAP_TEST_DIR)
  })
})
