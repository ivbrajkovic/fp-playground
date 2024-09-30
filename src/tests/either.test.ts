import { NormalizedError } from 'class/normalized-error';
import { Either, Left } from 'monads/either';
import { random } from 'utils';
import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeEach,
  afterAll,
  assertType,
  assert,
} from 'vitest';

describe('Either Monad', () => {
  const LEFT = 'Left';
  const RIGHT = 'Right';
  const ERROR_MESSAGE = 'Test error';
  const BAD_LUCK_ERROR = 'Bad luck, number is too large';

  let addOneFn: (x: number) => number;
  let addOTwoFn: (x: number) => number;
  let doubleFn: (x: number) => number;
  let tripleFn: (x: number) => number;
  let throwErrorFn: () => never;

  beforeEach(() => {
    addOneFn = vi.fn((x: number) => x + 1);
    addOTwoFn = vi.fn((x: number) => x + 2);
    doubleFn = vi.fn((x: number) => x * 2);
    tripleFn = vi.fn((x: number) => x * 3);
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
    it('should create a Left value', () => {
      const either = Either.ofLeft('Error');
      expect(either.container._tag).toBe('Left');
      expect(either.container.value).toBe('Error');
    });

    it('should create a Right value', () => {
      const either = Either.ofRight(42);
      expect(either.container._tag).toBe('Right');
      expect(either.container.value).toBe(42);
    });
  });

  describe('GetOrDefault', () => {
    it('should return default value for Left in getOrDefault', () => {
      const either = Either.ofLeft('Error');
      expect(either.getOrDefault(100)).toBe(100);
    });

    it('should return value for Right in getOrDefault', () => {
      const either = Either.ofRight(42);
      expect(either.getOrDefault(100)).toBe(42);
    });
  });

  describe('Ap', () => {
    it('should correctly apply function with ap', () => {
      const fnEither = Either.ofRight((x: number) => x + 1);
      const valEither = Either.ofRight(2);
      const result = fnEither.ap(valEither);
      expect(result.container._tag).toBe('Right');
      expect(result.container.value).toBe(3);
    });

    it('should return Left if either is Left in ap', () => {
      const fnEither = Either.ofLeft('Error');
      const valEither = Either.ofRight(2);
      const result = fnEither.ap(valEither);
      expect(result.container._tag).toBe('Left');
      expect(result.container.value).toBe('Error');
    });
  });

  describe('Map', () => {
    it('should correctly map over Right value', () => {
      const result = Either.ofRight(42);
      expect(result.container._tag).toBe(RIGHT);
      expect(result.container.value).toBe(42);
    });

    it('should handle multiple map operations', () => {
      const result = Either.ofRight(10)
        .map(addOneFn)
        .map(addOTwoFn)
        .map(doubleFn)
        .map(tripleFn);
      expect(result.container._tag).toBe(RIGHT);
      expect(result.container.value).toBe(78);
    });

    it('should return same Left when mapping over Left', () => {
      const result = Either.ofLeft(ERROR_MESSAGE) //
        .map(addOneFn)
        .map(doubleFn);
      expect(addOneFn).not.toHaveBeenCalled();
      expect(doubleFn).not.toHaveBeenCalled();
      expect(result.container._tag).toBe(LEFT);
      expect(result.container.value).toBe(ERROR_MESSAGE);
    });

    it('should safely map and catch errors', () => {
      const result = Either.ofRight(42) //
        .map(addOneFn)
        .safeMap(throwErrorFn)
        .map(doubleFn);
      expect(doubleFn).not.toHaveBeenCalled();
      assert(result.container.value instanceof NormalizedError);
      expect(result.container._tag).toBe(LEFT);
      expect(result.container.value.message).toBe(ERROR_MESSAGE);
    });

    it('should safely map right values and catch errors', () => {
      const randomNumber = random(0, 10);
      const result = Either.ofRight(randomNumber) //
        .map(addOneFn)
        .safeMap((value) => {
          if (value > 5) throw new Error(BAD_LUCK_ERROR);
          return value;
        })
        .map(doubleFn);
      if (result.container.value instanceof NormalizedError) {
        expect(result.container._tag).toBe(LEFT);
        expect(result.container.value.message).toBe(BAD_LUCK_ERROR);
      } else {
        expect(result.container._tag).toBe(RIGHT);
        expect(result.container.value).toBe((randomNumber + 1) * 2);
      }
    });
  });

  describe('Chain', () => {
    it('should correctly chain on Right value', () => {
      const either = Either.ofRight(42);
      const result = either.chain((x) => Either.ofRight(x + 1));
      expect(result.container._tag).toBe('Right');
      expect(result.container.value).toBe(43);
    });

    it('should return same Left when chaining over Left', () => {
      const either = Either.ofLeft('Error');
      const result = either.chain((value) => Either.ofRight(value + 1));
      expect(result.container._tag).toBe('Left');
      expect(result.container.value).toBe('Error');
    });

    it('should safely chain and catch errors', () => {
      const either = Either.ofRight(42);
      const result = either.safeChain((_value) => {
        throw new Error('Test error');
      });
      expect(result.container._tag).toBe('Left');
      expect(result.container.value).toBeInstanceOf(NormalizedError);
      expect(result.container.value.message).toBe('Test error');
    });

    it('should safely chain right values and catch errors', () => {
      const randomNumber = random(0, 10);
      const either = Either.ofRight(randomNumber);
      const result = either.safeChain((value) => {
        if (value > 5) throw new Error('Value is too large');
        return Either.ofRight(value);
      });
      if (result.container._tag === 'Left') {
        expect(result.container._tag).toBe('Left');
        expect(result.container.value).toBeInstanceOf(NormalizedError);
        expect(result.container.value.message).toBe('Value is too large');
      } else {
        expect(result.container._tag).toBe('Right');
        expect(result.container.value).toBe(randomNumber);
      }
    });
  });

  describe('Fold', () => {
    it('should fold correctly over Left', () => {
      const either = Either.ofLeft('Error');
      const result = either.fold(
        (l) => `Left: ${l}`,
        (r) => `Right: ${r}`,
      );
      expect(result).toBe('Left: Error');
    });

    it('should fold correctly over Right', () => {
      const either = Either.ofRight(42);
      const result = either.fold(
        (l) => `Left: ${l}`,
        (r) => `Right: ${r}`,
      );
      expect(result).toBe('Right: 42');
    });
  });

  describe('Map and Chain', () => {
    it('should handle multiple chain and map operations', () => {
      const result = Either.ofRight(10)
        .map((value) => value + 1)
        .chain((value) => Either.ofRight(value * 2))
        .map((value) => value - 5);
      expect(result.container._tag).toBe('Right');
      expect(result.container.value).toBe(17);
    });

    it('should handle Left propagation through chain and map', () => {
      const result = Either.ofRight(10)
        .map((x) => x + 1)
        .chain(() => Either.ofLeft('Error'))
        .map((x) => x - 5);
      expect(result.container._tag).toBe('Left');
      expect(result.container.value).toBe('Error');
    });
  });

  describe('OfTryCatch', () => {
    it('should execute ofTryCatch and catch errors', () => {
      const result = Either.ofTryCatch(() => {
        throw new Error('Test error');
      });
      expect(result.container._tag).toBe('Left');
      expect(result.container.value).toBeInstanceOf(NormalizedError);
      expect(result.container.value.message).toBe('Test error');
    });

    it('should execute ofTryCatch and return Right on success', () => {
      const result = Either.ofTryCatch(() => 42);
      expect(result.container._tag).toBe('Right');
      expect(result.container.value).toBe(42);
    });
  });
});
