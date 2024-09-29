import { Either } from 'monads/either';
import { NormalizedError } from 'class/normalized-error';

export const eitherTest = () => {
  // Example functions for testing
  const multiply =
    (a: number) =>
    (b: number): number =>
      a * b;
  const divide =
    (a: number) =>
    (b: number): number => {
      if (b === 0) throw new Error('Division by zero');
      return a / b;
    };
  const add =
    (a: number) =>
    (b: number): number =>
      a + b;

  const double = multiply(2);
  const addOne = add(1);

  // Safe division wrapped in Either using ofTryCatch
  const safeDivide = (a: number, b: number): Either<NormalizedError, number> =>
    Either.ofTryCatch(() => divide(a)(b));

  // Example usage of all functions:
  const result = safeDivide(10, 2)
    .map(double) // 5 * 2 = 10
    .chain((n) => Either.ofRight(addOne(n))) // 10 + 1 = 11
    .safeMap((n) => n * 3) // 11 x 3 = 33
    .safeMap(String) // "33"
    .fold(
      (err) => `Error: ${err.message}`,
      (result) => `Success: ${result}`,
    );

  console.log({ result }); // Output: Success: 12 (Length of "Result is: 18")

  // Example with division by zero, catching error and using getOrDefault:
  const resultWithDefault = safeDivide(10, 0).map(double).getOrDefault(42);

  console.log({ resultWithDefault }); // Output: 42 (default value)

  // Example of fold to handle errors explicitly:
  const resultWithSafeDivide = safeDivide(10, 0).fold(
    (err) => `Error: ${err.message}`,
    (result) => `Result: ${result}`,
  );

  console.log({ resultWithSafeDivide }); // Output: Handled Error: Division by zero

  // Example of safeChain catching an error in the chain:
  const resultWithSafeChain = safeDivide(10, 2)
    .safeChain((n) => {
      if (n > 5) throw new Error('Value is too large!');
      return Either.ofRight(n);
    })
    .fold(
      (err) => `Error: ${err.message}`,
      (result) => `Success: ${result}`,
    );

  console.log({ resultWithSafeChain }); // Output: Error: Value is too large!

  // Example of ap with mixed Either values
  const resultWithMixedAp = Either.ofRight((x: number) => x + 10)
    .ap(safeDivide(10, 2)) // Apply function to safe division result
    .fold(
      (err) => `Error: ${err.message}`,
      (result) => `Success: ${result}`,
    );

  console.log({ resultWithMixedAp }); // Output: Success: 15

  // Example of using Either.ofLeft explicitly:
  const resultLeft = Either.ofLeft(new Error('Forced error')).fold(
    (err) => `Handled Error: ${err.message}`,
    (result) => `Success: ${result}`,
  );

  console.log({ resultLeft }); // Output: Handled Error: Forced error

  const price = Either.ofRight(100); // Successfully fetched price: $100
  const quantity = Either.ofRight(3); // User input quantity: 3 items
  const taxRate = Either.ofRight(0.08); // Successfully fetched tax rate: 8%

  const calculateTotalPrice =
    (price: number) =>
    (quantity: number) =>
    (taxRate: number): number => {
      return price * quantity * (1 + taxRate);
    };

  // Wrapping the curried function inside an Either
  const calculateTotalPriceWrapper = Either.ofRight(calculateTotalPrice);

  // Applying the wrapped values to the curried function using `ap`
  const totalPrice = calculateTotalPriceWrapper
    .ap(price) // Applies price: (quantity) => (taxRate) => totalPrice
    .ap(quantity) // Applies quantity: (taxRate) => totalPrice
    .ap(taxRate) // Applies taxRate: totalPrice = price * quantity * (1 + taxRate)
    .fold(
      (err) => `Error: ${err}`, // Error handling
      (total) => `Total price: $${total}`, // Success handling
    );

  console.log({ totalPrice }); // Output: Total price: $324
};
