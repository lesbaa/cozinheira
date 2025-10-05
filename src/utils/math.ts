export function isCloseTo(a: number, b: number, epsilon: number = 0.00001) {
  return Math.abs(a - b) < epsilon;
}

export function precision(num: number, decimals: number) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}