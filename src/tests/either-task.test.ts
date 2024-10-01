import { NormalizedError } from 'class/normalized-error';
import { EitherTask, right } from 'monads/either-task';
import { wait } from 'utils';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll,
  assert,
} from 'vitest';

describe('EitherTask Monad', () => {
  const LEFT = 'Left';
  const RIGHT = 'Right';
  const ERROR_MESSAGE = 'Test error';

  // Helper functions to reduce code repetition
  const createRightTask = <R>(value: R) =>
    EitherTask.of(() => Promise.resolve(value));
  const createLeftTask = (error: unknown) =>
    EitherTask.of(() => Promise.reject(error));
  const createLeftErrorTask = () => createLeftTask(ERROR_MESSAGE);

  let addOneFn: (x: number) => number;
  let doubleFn: (x: number) => number;
  let addOneEitherTaskFn: (x: number) => EitherTask<NormalizedError, number>;
  let doubleEitherTaskFn: (x: number) => EitherTask<NormalizedError, number>;
  let throwErrorFn: () => never;

  beforeEach(() => {
    addOneFn = vi.fn((x: number) => x + 1);
    doubleFn = vi.fn((x: number) => x * 2);
    addOneEitherTaskFn = vi.fn((x: number) => createRightTask(x + 1));
    doubleEitherTaskFn = vi.fn((x: number) => createRightTask(x * 2));
    throwErrorFn = vi.fn(() => {
      throw new Error(ERROR_MESSAGE);
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('Creation', () => {
    it('should create a Right value when the task succeeds', async () => {
      const task = createRightTask(42);
      const result = await task.run();
      expect(result).toEqual(right(42));
    });

    it('should create a Left NormalizedError when the task fails', async () => {
      const error = new Error(ERROR_MESSAGE);
      const task = createLeftTask(error);
      const result = await task.run();
      expect(result.tag).toBe('Left');
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe(ERROR_MESSAGE);
    });
  });

  describe('Map', () => {
    it('should apply map to Right value', async () => {
      const task = createRightTask(10)
        .map(addOneFn)
        .map(addOneFn)
        .map(doubleFn);
      const result = await task.run();
      assert(result.tag === RIGHT);
      expect(result).toEqual(right(24));
    });

    it('should not apply map to Left value', async () => {
      const error = new Error(ERROR_MESSAGE);
      const task = createLeftTask(error)
        .map(addOneFn)
        .map(addOneFn)
        .map(doubleFn);
      const result = await task.run();
      assert(result.tag === LEFT);
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe(ERROR_MESSAGE);
    });

    it('should short-circuit map on Left value', async () => {
      const task = createRightTask(5)
        .map(addOneFn)
        .map(throwErrorFn)
        .map(doubleFn)
        .map(doubleFn);
      const result = await task.run();
      assert(result.tag === LEFT);
      expect(doubleFn).not.toHaveBeenCalled();
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe(ERROR_MESSAGE);
    });
  });

  describe('Chain', () => {
    it('should chain tasks correctly when initial task is Right', async () => {
      const task = createRightTask(5)
        .chain(addOneEitherTaskFn)
        .chain(addOneEitherTaskFn)
        .chain(doubleEitherTaskFn);
      const result = await task.run();
      assert(result.tag === RIGHT);
      expect(result).toEqual(right(14));
    });

    it('should not execute chained task if initial task is Left', async () => {
      const error = new Error(ERROR_MESSAGE);
      const task = createLeftTask(error)
        .chain(addOneEitherTaskFn)
        .chain(addOneEitherTaskFn)
        .chain(doubleEitherTaskFn);
      const result = await task.run();
      assert(result.tag === LEFT);
      expect(addOneEitherTaskFn).not.toHaveBeenCalled();
      expect(doubleEitherTaskFn).not.toHaveBeenCalled();
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe(ERROR_MESSAGE);
    });

    it('should short-circuit map on Left value', async () => {
      const task = createRightTask(5)
        .chain(addOneEitherTaskFn)
        .chain(createLeftErrorTask)
        .chain(doubleEitherTaskFn)
        .chain(doubleEitherTaskFn);
      const result = await task.run();
      assert(result.tag === LEFT);
      expect(doubleEitherTaskFn).not.toHaveBeenCalled();
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe(ERROR_MESSAGE);
    });

    it('should handle chains with different resolution times', async () => {
      const executionOrder: number[] = [];

      const task = EitherTask.of(() => {
        executionOrder.push(1);
        return wait(100).then(() => 5); // Task 1 resolves after 100ms
      })
        .chain((value) => {
          executionOrder.push(2);
          return EitherTask.of(() => wait(200).then(() => value * 2)); // Task 2 resolves after 200ms
        })
        .chain((value) => {
          executionOrder.push(3);
          return EitherTask.of(() => wait(50).then(() => value - 3)); // Task 3 resolves after 50ms
        });

      const result = await task.run();
      assert(result.tag === RIGHT);
      expect(executionOrder).toEqual([1, 2, 3]);
      expect(result).toEqual(right(7)); // 5 * 2 - 3 = 7
    });

    it('should stop execution on Left value', async () => {
      const executionOrder: number[] = [];

      const task = EitherTask.of(() => {
        executionOrder.push(1);
        return Promise.resolve(5);
      })
        .chain(() => {
          executionOrder.push(2);
          return EitherTask.of(() => Promise.reject(new Error(ERROR_MESSAGE)));
        })
        .chain(() => {
          executionOrder.push(3);
          return EitherTask.of(() => Promise.resolve(100));
        });

      const result = await task.run();
      assert(result.tag === LEFT);
      expect(executionOrder).toEqual([1, 2]);
      expect(result.value.message).toBe(ERROR_MESSAGE);
    });
  });

  describe('Fold', () => {
    it('should fold correctly for Right value', async () => {
      const task = createRightTask(5);
      const result = await task.fold(
        (left) => `Left: ${left}`,
        (right) => `Right: ${right}`,
      );
      expect(result).toBe('Right: 5');
    });

    it('should fold correctly for Left value', async () => {
      const error = new Error(ERROR_MESSAGE);
      const task = createLeftTask(error);
      const result = await task.fold(
        (left) => `Left: ${left.message}`,
        (right) => `Right: ${right}`,
      );
      expect(result).toBe(`Left: ${ERROR_MESSAGE}`);
    });
  });

  describe('Ap', () => {
    it('should apply the function of the right value to the right value', async () => {
      const addThree =
        (a: number) =>
        (b: number) =>
        (c: number): number =>
          a + b + c;
      const task = createRightTask(addThree)
        .ap(createRightTask(5))
        .ap(createRightTask(10))
        .ap(createRightTask(15));
      const result = await task.run();
      assert(result.tag === RIGHT);
      expect(result).toEqual(right(30));
    });

    it('should not apply the function of the right value to the left value', async () => {
      const error = new Error(ERROR_MESSAGE);
      const task = createRightTask(addOneFn).ap(createLeftTask(error));
      const result = await task.run();
      assert(result.tag === LEFT);
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe(ERROR_MESSAGE);
    });

    it('should not apply the function of the left value to the right value', async () => {
      const error = new Error(ERROR_MESSAGE);
      const task = createLeftTask(error).ap(createRightTask(5));
      const result = await task.run();
      assert(result.tag === LEFT);
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe(ERROR_MESSAGE);
    });

    it('should not apply the function of the left value to the left value', async () => {
      const error1 = new Error(ERROR_MESSAGE);
      const error2 = new Error('Another error');
      const task = createLeftTask(error1).ap(createLeftTask(error2));
      const result = await task.run();
      assert(result.tag === LEFT);
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe(ERROR_MESSAGE);
    });

    it('should short-circuit ap on Left value', async () => {
      const addThree =
        (a: number) =>
        (b: number) =>
        (c: number): number =>
          a + b + c;
      const task = createRightTask(addThree)
        .ap(createRightTask(5))
        .ap(createLeftErrorTask())
        .ap(createRightTask(10));
      const result = await task.run();
      assert(result.tag === LEFT);
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe(ERROR_MESSAGE);
    });

    it('should handle ap with different resolution times', async () => {
      const executionOrder: number[] = [];

      const addThree =
        (a: number) =>
        (b: number) =>
        (c: number): number =>
          a + b + c;

      const task = EitherTask.of(() => {
        executionOrder.push(1);
        return wait(100).then(() => addThree);
      })
        .ap(
          EitherTask.of(() => {
            executionOrder.push(2);
            return wait(200).then(() => 5);
          }),
        )
        .ap(
          EitherTask.of(() => {
            executionOrder.push(3);
            return wait(50).then(() => 10);
          }),
        )
        .ap(
          EitherTask.of(() => {
            executionOrder.push(4);
            return wait(300).then(() => 15);
          }),
        );

      const result = await task.run();
      assert(result.tag === RIGHT);
      expect(executionOrder).toEqual([1, 2, 3, 4]);
      expect(result).toEqual(right(30));
    });
  });

  describe('Lazy Evaluation', () => {
    it('should be lazy and not execute until run is called', async () => {
      const promiseTask = vi.fn(() => Promise.resolve(42));
      const task = EitherTask.of(promiseTask)
        .map(addOneFn)
        .chain(addOneEitherTaskFn);
      expect(promiseTask).not.toHaveBeenCalled();
      expect(addOneFn).not.toHaveBeenCalled();
      expect(addOneEitherTaskFn).not.toHaveBeenCalled();
      await task.run();
      expect(promiseTask).toHaveBeenCalled();
      expect(addOneFn).toHaveBeenCalled();
      expect(addOneEitherTaskFn).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle task resolving with undefined', async () => {
      const task = EitherTask.of(() => Promise.resolve(undefined));
      const result = await task.run();
      expect(result).toEqual(right(undefined));
    });

    it('should handle task rejecting with null', async () => {
      const task = EitherTask.of<null>(() => Promise.reject(null));
      const result = await task.run();
      assert(result.tag === LEFT);
      expect(result.value).toEqual(NormalizedError.from(null));
    });
  });
});
