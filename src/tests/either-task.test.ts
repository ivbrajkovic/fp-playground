import { NormalizedError } from 'class/normalized-error';
import { EitherTask, right } from 'monads/either-task';
import { wait } from 'utils';
import { describe, it, expect, vi } from 'vitest';

// Helper functions to reduce code repetition
const createRightTask = <R>(value: R) =>
  EitherTask.of(() => Promise.resolve(value));
const createLeftTask = (error: Error) =>
  EitherTask.of(() => Promise.reject(error));

describe('EitherTask Monad', () => {
  describe('Creation', () => {
    it('should create a Right value when the task succeeds', async () => {
      const task = createRightTask(42);
      const result = await task.run();
      expect(result).toEqual(right(42));
    });

    it('should create a Left NormalizedError when the task fails', async () => {
      const error = new Error('Test error');
      const task = createLeftTask(error);
      const result = await task.run();
      expect(result.tag).toBe('Left');
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe('Test error');
    });
  });

  describe('Map', () => {
    it('should apply map to Right value', async () => {
      const task = createRightTask(10).map((x) => x * 2);
      const result = await task.run();
      expect(result).toEqual(right(20));
    });

    it('should not apply map to Left value', async () => {
      const error = new Error('Test error');
      const task = createLeftTask(error).map((x) => x * 2);
      const result = await task.run();
      expect(result.tag).toBe('Left');
      if (result.tag === 'Left') {
        expect(result.value).toBeInstanceOf(NormalizedError);
        expect(result.value.message).toBe('Test error');
      }
    });

    it('should catch errors in map function and return Left NormalizedError', async () => {
      const task = createRightTask(5).map(() => {
        throw new Error('Map function error');
      });
      const result = await task.run();
      expect(result.tag).toBe('Left');
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe('Map function error');
    });

    it('should not execute map function if task is Left', async () => {
      const error = new Error('Initial task error');
      const mapFunction = vi.fn(() => 42);
      const task = createLeftTask(error).map(mapFunction);
      const result = await task.run();
      expect(mapFunction).not.toHaveBeenCalled();
      expect(result.tag).toBe('Left');
      if (result.tag === 'Left') {
        expect(result.value).toBeInstanceOf(NormalizedError);
        expect(result.value.message).toBe('Initial task error');
      }
    });
  });

  describe('Chain', () => {
    it('should chain tasks correctly when initial task is Right', async () => {
      const task = createRightTask(5).chain((x) => createRightTask(x * 2));
      const result = await task.run();
      expect(result).toEqual(right(10));
    });

    it('should not execute chained task if initial task is Left', async () => {
      const error = new Error('Initial task error');
      const chainedTask = vi.fn(() => createRightTask(2));
      const task = createLeftTask(error).chain(chainedTask);
      const result = await task.run();
      expect(chainedTask).not.toHaveBeenCalled();
      expect(result.tag).toBe('Left');
      if (result.tag === 'Left') {
        expect(result.value).toBeInstanceOf(NormalizedError);
        expect(result.value.message).toBe('Initial task error');
      }
    });

    it('should handle Left from chained task', async () => {
      const task = createRightTask(5).chain(() =>
        createLeftTask(new Error('Chained task error')),
      );
      const result = await task.run();
      expect(result.tag).toBe('Left');
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe('Chained task error');
    });

    it('should catch errors in chain function and return Left NormalizedError', async () => {
      const task = createRightTask(5).chain(() => {
        throw new Error('Chain function error');
      });
      const result = await task.run();
      expect(result.tag).toBe('Left');
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe('Chain function error');
    });

    it('should not chain if task is Left', async () => {
      const error = new Error('Initial task error');
      const chainFunction = vi.fn(() => createRightTask(42));
      const task = createLeftTask(error).chain(chainFunction);
      const result = await task.run();
      expect(chainFunction).not.toHaveBeenCalled();
      expect(result.tag).toBe('Left');
      if (result.tag === 'Left') {
        expect(result.value).toBeInstanceOf(NormalizedError);
        expect(result.value.message).toBe('Initial task error');
      }
    });

    it('should handle multiple dependency chains', async () => {
      const executionOrder: number[] = [];

      const task = EitherTask.of(() => {
        executionOrder.push(1);
        return Promise.resolve(5);
      })
        .chain((value) => {
          executionOrder.push(2);
          return EitherTask.of(() => Promise.resolve(value * 2));
        })
        .chain((value) => {
          executionOrder.push(3);
          return EitherTask.of(() => Promise.resolve(value * 2));
        })
        .chain((value) => {
          executionOrder.push(4);
          return EitherTask.of(() => Promise.resolve(value + 1));
        });

      const result = await task.run();
      expect(executionOrder).toEqual([1, 2, 3, 4]);
      expect(result).toEqual(right(21)); // (((5 * 2) * 2) + 1) = 21
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
          return EitherTask.of(() => Promise.reject(new Error('Failure')));
        })
        .chain(() => {
          executionOrder.push(3);
          return EitherTask.of(() => Promise.resolve(100));
        });

      const result = await task.run();
      expect(executionOrder).toEqual([1, 2]);
      expect(result.tag).toBe('Left');
      if (result.tag === 'Left') expect(result.value.message).toBe('Failure');
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
      const error = new Error('Test error');
      const task = createLeftTask(error);
      const result = await task.fold(
        (left) => `Left: ${left.message}`,
        (right) => `Right: ${right}`,
      );
      expect(result).toBe('Left: Test error');
    });
  });

  describe('Lazy Evaluation', () => {
    it('should be lazy and not execute until run is called', async () => {
      let executed = false;
      const task = EitherTask.of(() => {
        executed = true;
        return Promise.resolve(42);
      });
      expect(executed).toBe(false);
      await task.run();
      expect(executed).toBe(true);
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
      expect(result.tag).toBe('Left');
      if (result.tag === 'Left') {
        expect(result.value).toEqual(NormalizedError.from(null));
      }
    });
  });
});
