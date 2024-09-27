import { Left, Right } from '../Either';
import { log } from '../utils';

export const eitherTest = () => {
  const eitherFactory = (x: number) =>
    x === 3 ? Left.from('Some error happened.') : Right.from(x);
  // Right.from(x);
  // Left.from('Some error happened.');
  const either = eitherFactory(2);
  const result = either.fold(
    (error) => (console.log(error), null),
    (value) => value * 10
  );
  if (either.isLeft()) {
    either.value;
  }
  log(result);
};
