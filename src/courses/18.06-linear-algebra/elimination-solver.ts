export function eliminate(
  matrix: number[][],
  start: { row: number; col: number }
) {
  // printMatrix(matrix);
  const shape = {
    m: matrix.length,
    n: matrix[0].length,
  };

  let pivotValue = matrix?.[start.row]?.[start.col];
  // This means the matrix is 0 x 0, which means we have finished
  // elimination.
  if (pivotValue === undefined) return;
  if (pivotValue === 0) {
    // console.log("Not handling permutations right now");
    throw new Error("Not handling permutations right now");
  }

  const pivotRow = matrix[start.row];
  for (let i = start.col; i < shape.n; i++) pivotRow[i] /= pivotValue;
  // printMatrix(matrix);
  for (let i = start.row + 1; i < matrix.length; i++) {
    const row = matrix[i];
    const factor = row[start.col];
    for (let j = start.col; j < shape.n; j++) {
      // console.log(`${row[j]} -= ${factor} * ${pivotRow[j]}`);
      row[j] -= factor * pivotRow[j];
    }
  }

  eliminate(matrix, {
    row: start.row + 1,
    col: start.col + 1,
  });
}

export function stringifyMatrix(matrix: number[][]) {
  const rows = matrix.map((row, i) => {
    return `  [${row.join(",")}]${i === matrix.length - 1 ? "" : ","}`;
  });
  return `[\n${rows.join("\n")}\n]`;
}

export function printMatrix(matrix: number[][]) {
  console.log(stringifyMatrix(matrix));
}

export function eliminateUp(matrix: number[][]) {
  const shape = {
    row: matrix.length,
    col: matrix[0].length,
  };
  printMatrix(matrix);
  for (let i = 0; i < shape.row; i++) {
    const pivotRow = matrix[i];
    let pivot = pivotRow[0];
    let pivotIndex = 0;
    for (let j = 1; j < shape.col; j++) {
      if (pivot === 1) break;
      pivot = pivotRow[j];
      pivotIndex = j;
    }
    // Row of all zeroes or non-ones. Non-ones we shouldn't have.
    if (pivot !== 1) return;
    for (let r = i - 1; r >= 0; r--) {
      const row = matrix[r];
      const factor = row[pivotIndex];
      for (let j = pivotIndex; j < shape.col; j++) {
        row[j] -= factor * pivotRow[j];
      }
    }
  }
  printMatrix(matrix);
}
