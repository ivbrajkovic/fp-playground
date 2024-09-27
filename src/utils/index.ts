export const log = console.log;

export const wait = (mils: number) =>
  new Promise((resolve) => setTimeout(resolve, mils));

export const sum = (a: number, b: number) => a + b;
export const mul = (a: number, b: number) => a * b;
export const isEven = (a: number) => a % 2 === 0;
export const isOd = (a: number) => !isEven(a);
export const append = <T>(xs: T[], x: T) => (xs.push(x), xs);
export const double = (a: number) => mul(a, 2);

export const sequence = (length: number, start = 1) =>
  Array.from({ length }, (_, i) => i + start);

export const mapReducer = (fn) => (r) => (acc, curr) => r(acc, fn(curr));
export const filterReducer = (fn) => (r) => (acc, curr) =>
  fn(curr) ? r(acc, curr) : acc;

export const tax = (tax: number) => (a: number) => a + (a * tax) / 100;
