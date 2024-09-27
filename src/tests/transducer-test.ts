import compose from 'lodash/fp/compose';
import {
  append,
  double,
  filterReducer,
  isEven,
  log,
  mapReducer,
  sequence,
  tax,
} from '../utils';

export const transducerTest = () => {
  const data = sequence(5);
  const tax25 = tax(25);

  const doubleValues = mapReducer(double);
  const addTax25 = mapReducer(tax25);
  const isEvenFilter = filterReducer(isEven);

  const transducer = (xs, c, r, init) => xs.reduce(c(r), init);

  const composition = compose(
    isEvenFilter, // [1, 2, 3, 4, 5] => [2, 4];
    doubleValues, // [2, 4] => [5, 10]
    addTax25 // [5, 10]
  );

  const res = transducer(data, composition, append, []);
  log(res);
};
