import { test, expect } from "bun:test";
import { eliminate, eliminateUp, stringifyMatrix } from "./elimination-solver";

test("elimination", () => {
  const matrix = [
    [1, 2],
    [2, 5],
  ];
  eliminate(matrix, { row: 0, col: 0 });
  expect(stringifyMatrix(matrix)).toEqual(
    `[
  [1,2],
  [0,1]
]`.trim()
  );

  eliminateUp(matrix);
  expect(stringifyMatrix(matrix)).toEqual(
    `[
  [1,0],
  [0,1]
]`.trim()
  );
});

test("elimination", () => {
  const matrix = [
    [1, 2, 3],
    [2, 5, 0],
    [4, 8, 0],
  ];
  eliminate(matrix, { row: 0, col: 0 });
  expect(stringifyMatrix(matrix)).toEqual(
    `[
  [1,2,3],
  [0,1,-6],
  [0,0,1]
]`.trim()
  );

  eliminateUp(matrix);
  expect(stringifyMatrix(matrix)).toEqual(
    `[
  [1,0,0],
  [0,1,0],
  [0,0,1]
]`.trim()
  );
});

test("elimination", () => {
  const matrix = [
    [1, 2, 3],
    [2, 5, 0],
  ];
  eliminate(matrix, { row: 0, col: 0 });
  expect(stringifyMatrix(matrix)).toEqual(
    `[
  [1,2,3],
  [0,1,-6]
]`.trim()
  );

  eliminateUp(matrix);
  expect(stringifyMatrix(matrix)).toEqual(
    `[
  [1,0,15],
  [0,1,-6]
]`.trim()
  );
});
