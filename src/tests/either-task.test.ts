import { NormalizedError } from 'class/normalized-error';
import { EitherTask, eitherTaskRight } from 'monads/either-task';
import { describe, it, expect } from 'vitest';

describe('EitherTask', () => {
  it('should create a Right value when the task succeeds', async () => {
    const task = EitherTask.of(() => Promise.resolve(42));
    const result = await task.run();
    expect(result).toEqual(eitherTaskRight(42));
  });

  it('should create a Left NormalizedError when the task fails', async () => {
    const error = new Error('Test error');
    const task = EitherTask.of(() => Promise.reject(error));
    const result = await task.run();
    expect(result.tag).toBe('Left');
    if (result.tag === 'Left') {
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe('Test error');
    }
  });

  it('should apply map to Right value', async () => {
    const task = EitherTask.of(() => Promise.resolve(10)).map((x) => x * 2);
    const result = await task.run();
    expect(result).toEqual(eitherTaskRight(20));
  });

  it('should not apply map to Left value', async () => {
    const error = new Error('Test error');
    const task = EitherTask.of<number>(() => Promise.reject(error)).map(
      (x) => x * 2,
    );
    const result = await task.run();
    expect(result.tag).toBe('Left');
    if (result.tag === 'Left') {
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe('Test error');
    }
  });

  it('should chain tasks correctly when initial task is Right', async () => {
    const task = EitherTask.of(() => Promise.resolve(5)).chain((x) =>
      EitherTask.of(() => Promise.resolve(x * 2)),
    );
    const result = await task.run();
    expect(result).toEqual(eitherTaskRight(10));
  });

  it('should not execute chained task if initial task is Left', async () => {
    const error = new Error('Initial task error');
    let chainedTaskExecuted = false;
    const task = EitherTask.of<number>(() => Promise.reject(error)).chain(
      (x) => {
        chainedTaskExecuted = true;
        return EitherTask.of(() => Promise.resolve(x * 2));
      },
    );
    const result = await task.run();
    expect(chainedTaskExecuted).toBe(false);
    expect(result.tag).toBe('Left');
    if (result.tag === 'Left') {
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe('Initial task error');
    }
  });

  it('should handle Left from chained task', async () => {
    const task = EitherTask.of(() => Promise.resolve(5)).chain((_) =>
      EitherTask.of(() => Promise.reject(new Error('Chained task error'))),
    );
    const result = await task.run();
    expect(result.tag).toBe('Left');
    if (result.tag === 'Left') {
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe('Chained task error');
    }
  });

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

  it('should catch errors in map function and return Left NormalizedError', async () => {
    const task = EitherTask.of(() => Promise.resolve(5)).map((_) => {
      throw new Error('Map function error');
    });
    const result = await task.run();
    expect(result.tag).toBe('Left');
    expect(result.value).toBeInstanceOf(NormalizedError);
    expect(result.value.message).toBe('Map function error');
  });

  it('should catch errors in chain function and return Left NormalizedError', async () => {
    const task = EitherTask.of(() => Promise.resolve(5)).chain((_) => {
      throw new Error('Chain function error');
    });
    const result = await task.run();
    expect(result.tag).toBe('Left');
    if (result.tag === 'Left') {
      expect(result.value).toBeInstanceOf(NormalizedError);
      expect(result.value.message).toBe('Chain function error');
    }
  });
});
