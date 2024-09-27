import { chain } from 'generators/generator';
import { Either } from 'monads/either-2';
import { tap } from 'utils';

export const either2Test = () => {
  // const left = Either.left('error');
  // const right = Either.right(42);

  // console.log(left);
  // console.log(right.toString());

  Either.right(10) //
    .map((x) => {
      console.log('map ->', x);
      return x * 2;
    })
    .safeMap((x) => {
      throw new Error('error in safeMap');
      return x;
    })
    .map((x) => {
      console.log('map ->', x);
      return x * 2;
    })
    .map((x) => {
      console.log('map ->', x);
      return x * 2;
    })
    .fold(
      (x) => {
        console.log('onLeft ->', x.message);
        return x;
      },
      (x) => {
        console.log('onRight ->', x);
        return x;
      },
    );

  console.log('---');

  Either.right(2) //
    .map((x) => {
      console.log('map ->', x);
      return x * 2;
    })
    .chain((x) => {
      console.log('chain ->', x);
      return Either.right(x * 2);
    })
    .safeChain((x) => {
      console.log('safeChain ->', x);
      throw new Error('error in safeChain');
      return Either.right(x * 2);
    })
    .safeChain((x) => {
      console.log('safeChain ->', x);
      return Either.right(x * 2);
    })
    // .safeMap((x) => {
    //   throw new Error('error in safeMap');
    //   return x;
    // })
    // .map((x) => {
    //   console.log('map ->', x);
    //   return x * 2;
    // })
    // .map((x) => {
    //   console.log('map ->', x);
    //   return x * 2;
    // })
    .fold(
      (x) => {
        console.log('onLeft ->', x.message);
        return x;
      },
      (x) => {
        console.log('onRight ->', x);
        return x;
      },
    );

  console.log('---');

  const res1 = Either.right(42) //
    .map((x) => x * 2)
    // .map(String)
    .safeMap((x) => {
      throw new Error('error in safeMap');
      return x;
    })
    .map((x) => x * 2)
    // .map(String)
    .getOrElse('default value');

  const res2 = Either.left(new Error('error')) //
    .map((x) => x * 2)
    .map((x) => x * 2)
    // .map(String)
    .getOrElse('default value');

  const res3 = Either.right(42)
    .chain((x) => Either.right(x * 2))
    .safeChain((x) => {
      throw new Error('error in safeChain');
      return Either.right(x * 2);
    })
    .chain((x) => Either.right(x * 2))
    .getOrElse('default value');

  const res4 = Either.left(new Error('error'))
    .chain((x) => Either.right(x * 2))
    .chain((x) => Either.right(x * 2))
    .getOrElse('default value');

  const res5 = Either.right(42)
    .chain((x) => Either.left(x * 2))
    .chain((x) => {
      const left = Either.left('Chain left');
      return left;
    })
    .chain((x) => Either.right(x * 2))
    .chain((x) => Either.right(x * 2))
    // .chain((x) => Either.left(x * 2))
    // .chain((x) => Either.right(x * 2))
    .getOrElse('default value');
};
