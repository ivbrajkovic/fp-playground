import { EitherTask } from 'monads/either-task';
import { log, wait } from '../utils';

const delayResolve =
  <T>(value: T, delay: number) =>
  () =>
    new Promise<T>((resolve) => {
      log('Daley resolve with value:', value);
      setTimeout(() => resolve(value), delay);
    });

const delayReject =
  <T>(value: T, delay: number) =>
  () =>
    new Promise<T>((_, reject) => {
      log('Daley reject with value:', value);
      setTimeout(() => reject(value), delay);
    });

export const eitherTaskTest = async () => {
  const result = await EitherTask.of(delayResolve(100, 1000))
    // .map((x) => x * 2)
    // .map((x) => x * 2)
    // .map((x) => {
    //   throw 'Throw inside map';
    //   // if (value === 'error') throw 'Throw inside map';
    //   // if (value === 'error') throw { error: 'Throw inside map' };
    //   // if (value === 'error') throw new Error('Throw inside map');
    //   return x;
    // })
    .chain((x) => EitherTask.of(delayResolve(x + 1, 1000)))
    // .chain(et2.map.bind(null).chain)
    // .chain((value) => {
    //   const et = et2.chain((innerValue) => innerValue + ' ' + value);
    //   return et;
    // })
    .map((value) => value + ' and again')
    .fold(
      (err) => `Error: ${err.message}`,
      (result) => `Success: ${result}`,
    );

  log({ result });
};
