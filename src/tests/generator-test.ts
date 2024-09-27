import pipe from 'lodash/fp/pipe';
// import { fromPromiseEither } from '../generatorEither';
import {
  fromPromiseTryCatch,
  catchError,
  fromPromise,
  interval,
  map,
  take,
} from '../generator';
import { double, log, wait } from '../utils';

const count = () => {
  let n = 0;
  return () =>
    new Promise<number>((resolve, reject) => {
      log('Count promise started.');
      resolve(++n);
      log('Count promise ended.');
    });
};

// Simulated asynchronous function that resolves after a delay
const asyncTask = (value: number) => async () => {
  log('asyncTask ->', value);
  await wait(100); // Simulate delay
  if (value % 2 === 0) throw new Error(`Error for even number: ${value}`);
  return value * 2;
};

export const genereatorTest = async () => {
  const generator = pipe(
    asyncTask,
    fromPromise,
    // fromPromiseTryCatch,
    // fromPromiseEither,
    // fromGeneratorFunc,
    // createEitherGenerator,
    // catchLeft,
    interval(1000),
    // map((x) => {
    //   if (x.isRight()) return Right.from(x.value * 2);
    //   return x;
    // }),
    // map((x) => x.map(double))
    // map((x) => {
    //   if (x.isRight() && x.value === 4) {
    //     throw new Error('map => x is 4');
    //   }
    //   return x;
    // }),
    // toEather,
    catchError,
    // catchLeft,
    // takeUntilLeft,
    take(3)
  )(2);

  log('Generator test started.');
  for await (const res of generator()) {
    log('res ->', res.toString());
    if (res > 3) break;
  }
  log('Generator test ended.');
};
