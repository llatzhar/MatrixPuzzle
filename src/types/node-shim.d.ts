declare module "node:fs/promises" {
  export function readFile(path: string, encoding: "utf8"): Promise<string>;
  export function writeFile(path: string, data: string, encoding: "utf8"): Promise<void>;
}

declare module "node:test" {
  type TestFn = (name: string, fn: () => void | Promise<void>) => void;
  const test: TestFn;
  export default test;
}

declare module "node:assert/strict" {
  const assert: {
    equal(actual: unknown, expected: unknown, message?: string): void;
    throws(fn: () => void, matcher?: RegExp): void;
  };
  export default assert;
}

declare const process: {
  argv: string[];
  exitCode: number;
  stderr: {
    write(text: string): void;
  };
};
