#!/usr/bin/env bun
// import { sudo } from "@/lib.ts"
import { ClackLogger } from "@/core/logger.ts"
import { bootstrap } from "@/core/bootstrap.ts"
import { main } from "@/core/main.ts"
import type { SesameConfig } from "@/core/config/schema.ts"
import type { Result } from "ts-explicit-errors"

/**
 * sesame
 *
 * @param config wip
 */
async function sesame(config: SesameConfig): Promise<Result> {
  const logger = new ClackLogger()

  if (process.env["SESAME_BOOTSTRAPPED"] === "TRUE") {
    const error = await main(config, logger)
    if (error) logger.error(error.fmtErr())
  } else {
    const error = await bootstrap()
    if (error) logger.error(error.fmtErr("failed to bootstrap sesame"))
  }
}

export { sesame }
