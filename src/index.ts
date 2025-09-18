#!/usr/bin/env bun
import process from "node:process"
import type { Result } from "ts-explicit-errors"

import { bootstrap } from "@/core/bootstrap.ts"
import type { SesameConfig } from "@/core/config/schema.ts"
import { ClackLogger } from "@/core/logger.ts"
import { main } from "@/core/main.ts"

/**
 * sesame
 *
 * @param config wip
 */
async function sesame(config: SesameConfig): Promise<Result> {
  const logger = new ClackLogger()

  if (process.env["SESAME_BOOTSTRAPPED"] === "TRUE") {
    const error = await main(config, logger)
    if (error) logger.error(error.messageChain)
  } else {
    const error = await bootstrap()
    if (error) logger.error(`failed to bootstrap sesame: ${error.messageChain}`)
  }
}

export { sesame }
