export function isCloseTo(a: number, b: number, epsilon: number = 0.00001) {
  return Math.abs(a - b) < epsilon;
}