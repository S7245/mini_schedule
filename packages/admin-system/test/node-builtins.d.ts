declare module 'node:assert/strict' {
  interface StrictAssert {
    equal(actual: unknown, expected: unknown, message?: string): void
    deepEqual(actual: unknown, expected: unknown, message?: string): void
  }

  const assert: StrictAssert
  export default assert
}

declare module 'node:test' {
  type TestCallback = () => void | Promise<void>

  export default function test(name: string, callback: TestCallback): void
}
