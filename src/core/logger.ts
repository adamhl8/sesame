import { log as clackLog, confirm, intro, isCancel, outro } from "@clack/prompts"
import figures from "figures"
import pc from "picocolors"
import type { Result } from "ts-explicit-errors"
import { err } from "ts-explicit-errors"

type Figure = keyof typeof figures

/**
 * Log Object that will use clack builtin log functions like .info, .warn, etc
 *
 * These never have a symbol since those functions include their own
 */
interface LogObjForClackBuiltin {
  message: string
  logFn: (message: string) => void
  label?: string
  color?: (m: string) => string
  symbol?: undefined
}

/**
 * Log Object for custom clack log messages
 *
 * These have a symbol and always use the .message function since that is the function that accepts a custom symbol
 */
interface LogObjForClackMessage {
  message: string
  logFn: typeof clackLog.message
  label?: string
  color?: (m: string) => string
  symbol: Figure
}

type LogObject = LogObjForClackBuiltin | LogObjForClackMessage

export interface LoggerOptions {
  scope?: string[]
}

class ClackLogger {
  readonly #scope: string[]

  public constructor(options: LoggerOptions = {}) {
    this.#scope = options.scope ?? []
  }

  public scope(scope: string) {
    return new ClackLogger({ scope: [...this.#scope, scope] })
  }

  public getScope() {
    return this.#scope
  }

  #log(logObject: LogObject) {
    const { message, logFn, label = "", color = (m) => m, symbol } = logObject

    let scopeString = this.#scope.length > 0 ? `[${this.#scope.join("][")}] ` : ""
    scopeString = pc.dim(scopeString)

    const dimPointer = pc.dim(figures.pointerSmall)
    const coloredLabel = color(label)
    const labelString = label ? `${coloredLabel} ${dimPointer} ` : `${dimPointer} `

    const logString = `${scopeString}${labelString}${message}`

    // if there's a symbol, we know the logFn is clackLog.message
    if (symbol) logFn(logString, { symbol: color(figures[symbol]) })
    else logFn(logString)
  }

  public intro(message: string) {
    this.#log({
      message,
      logFn: intro,
    })
  }

  public outro(message: string) {
    this.#log({
      message,
      logFn: outro,
    })
  }

  public info(message: string) {
    this.#log({
      message,
      logFn: clackLog.info,
      label: "info",
      color: pc.blue,
    })
  }

  public success(message: string) {
    this.#log({
      message,
      logFn: clackLog.success,
      label: "success",
      color: pc.green,
    })
  }

  public warn(message: string) {
    this.#log({
      message,
      logFn: clackLog.warn,
      label: "warn",
      color: pc.yellow,
    })
  }

  public error(message: string) {
    this.#log({
      message,
      logFn: clackLog.error,
      label: "error",
      color: pc.red,
    })
  }

  public start(message: string) {
    this.#log({
      message,
      logFn: clackLog.message,
      label: "start",
      color: pc.magenta,
      symbol: "triangleRight",
    })
  }

  public diff(message: string) {
    this.#log({
      message,
      logFn: clackLog.message,
      label: "diff",
      color: pc.yellow,
      symbol: "triangleUp",
    })
  }

  public noDiff(message: string) {
    this.#log({
      message,
      logFn: clackLog.message,
      label: "no diff",
      color: pc.cyan,
      symbol: "tick",
    })
  }

  public async continue(message: string): Promise<Result<boolean>> {
    const shouldContinue = await confirm({ message })

    if (isCancel(shouldContinue)) return err("canceled")
    return shouldContinue
  }
}

export { ClackLogger }

const logger = new ClackLogger()
