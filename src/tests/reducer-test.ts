import { append, double, isEven, log, sequence, sum, tax } from '../utils';

export const reducerTest = () => {
  const data = sequence(5);
  const tax25 = tax(25);

  const mapReducer =
    <T, U>(fn: (curr: T) => U) =>
    <A>(r: (acc: A, curr: U) => A) =>
    (acc: A, curr: T): A =>
      r(acc, fn(curr));

  const filterReducer =
    <T, A>(fn: (curr: T) => boolean) =>
    (r: (acc: A, curr: T) => A) =>
    (acc: A, curr: T): A =>
      fn(curr) ? r(acc, curr) : acc;

  // const mapReducer = (fn) => (r) => (acc, curr) => r(acc, fn(curr));
  // const filterReducer = (fn) => (r) => (acc, curr) =>
  //   fn(curr) ? r(acc, curr) : acc;

  const doubleValues = mapReducer(double);
  const addTax25 = mapReducer(tax25);
  const isEvenFilter = filterReducer(isEven);

  const res1 = data.reduce((acc, curr) => acc + curr * 2, 0);
  const res2 = data.reduce(doubleValues(sum), 0);
  const res3 = data.reduce(doubleValues(append), []);
  const res4 = data.reduce(addTax25(append), []);
  const res5 = data.reduce(isEvenFilter(append), []);

  log(res1);
  log(res2);
  log(res3);
  log(res4);
  log(res5);
};
