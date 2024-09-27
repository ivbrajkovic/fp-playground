import { EitherTask } from '../EitherTask';
import { log, wait } from '../utils';

export const eitherTaskTest = () => {
  const promise = new Promise<string>((resolve, reject) => {
    log('Promise started');
    wait(1000).then(() => resolve('Promise resolved'));
    // wait(1000).then(() => reject('Promise rejected'));
    log('Promise ended');
  });

  const et1 = EitherTask.from(promise);
  const et2 = EitherTask.from(Promise.resolve(5));

  et1
    .map((value) => value + ' mapped')
    .map((value) => value + ' again')
    // .map((value) => 'error')
    // .map((value) => 123)
    .map((value) => {
      // throw 'Throw inside map';
      // if (value === 'error') throw 'Throw inside map';
      // if (value === 'error') throw { error: 'Throw inside map' };
      // if (value === 'error') throw new Error('Throw inside map');
      return value;
    })
    // .chain(et2.map.bind(null).chain)
    .chain((value) => {
      const et = et2.chain((innerValue) => innerValue + ' ' + value);
      return et;
    })
    // .map((value) => value + ' and again')
    .fold(
      (left) => {
        log('Left ->', left.message);
      },
      (right) => {
        log('Right ->', right);
      }
    );
};
