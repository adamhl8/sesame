import { rm } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { spawnSync } from "bun"
import type { Result } from "ts-explicit-errors"
import { attempt, err, isErr } from "ts-explicit-errors"

/**
 * @returns wip
 */
export async function bootstrap(): Promise<Result> {
  // When running the built binary, Bun.main is something like "/$bunfs/root/foo.ts"
  // So we have to get Bun.main during bootstrap and pass it to the binary via environment variable
  const SESAME_ROOT_DIR = path.dirname(Bun.main)

  const sesameBinaryPath = `${SESAME_ROOT_DIR}/sesame`

  const bunBuildResult = attempt(() =>
    spawnSync(
      [
        "bun",
        "build",
        `${SESAME_ROOT_DIR}/sesame.ts`,
        "--compile",
        "--target=bun",
        "--minify",
        `--outfile=${sesameBinaryPath}`,
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    ),
  )
  if (isErr(bunBuildResult)) return err("failed to compile sesame binary", bunBuildResult)
  if (bunBuildResult.exitCode !== 0) {
    const stderrString = bunBuildResult.stderr.toString().trim()
    const errorMessage = stderrString.startsWith("error: ModuleNotFound")
      ? "failed to compile sesame binary: 'sesame.ts' not found (sesame() must be called from a file named 'sesame.ts')"
      : "failed to compile sesame binary"
    return err(`${errorMessage}: ${stderrString}`, undefined)
  }

  const sesameResult = attempt(() =>
    spawnSync([sesameBinaryPath, ...process.argv.slice(2)], {
      env: { ...Bun.env, SESAME_BOOTSTRAPPED: "TRUE", SESAME_ROOT_DIR },
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    }),
  )
  if (isErr(sesameResult)) return err("failed to run sesame binary", sesameResult)

  /*
    If the parent process is killed (e.g. via SIGINT), exitCode from the child process will be null since it's immediately killed
    ^Only relevant if we are capturing/handling the exit signal (which we aren't right now), otherwise this line never applies
    We propagate the exit code from the child process if there is one for whatever reason
  */
  if (sesameResult.exitCode) process.exitCode = sesameResult.exitCode

  await rm(`${SESAME_ROOT_DIR}/sesame`, { force: true })
}
