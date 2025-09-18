/** biome-ignore-all lint/suspicious/noMisplacedAssertion: ignore */
import { expect } from "bun:test"
import type { CtxError, Result } from "ts-explicit-errors"
import { isErr } from "ts-explicit-errors"

/**
 * @param result A `Result` expected to be a `CtxError`
 */
function expectErr<T>(result: Result<T>): asserts result is CtxError {
  expect(isErr(result)).toBe(true)
}

/**
 * @param result A `Result` expected to be `T`
 */
function expectNotErr<T>(result: Result<T>): asserts result is T {
  expect(isErr(result)).toBe(false)
}

// function createMockLogger() {
//   return {
//     intro: jest.fn(),
//     outro: jest.fn(),
//     info: jest.fn(),
//     success: jest.fn(),
//     warn: jest.fn(),
//     error: jest.fn(),
//     diff: jest.fn(),
//     noDiff: jest.fn(),
//     start: jest.fn(),
//     scope: jest.fn(),
//   }
// }

export { expectErr, expectNotErr }
