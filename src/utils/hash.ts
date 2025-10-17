const stringToRangeMemoizedData: Record<string, number> = {};

export function stringToRange(str: string, range: [number, number] = [0, 2 * Math.PI], memoize: boolean = true) {
  if (memoize && stringToRangeMemoizedData[str]) {
    return stringToRangeMemoizedData[str];
  }

  let hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (let i = str.length - 1; i >= 0; i--) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char; // A common hashing technique
    hash = hash & hash; // Convert to 32bit integer
  }

  // Normalize to a value between 0 and 1
  const normalized = (hash & 0x7fffffff) / 0x7fffffff;

  // Scale to the desired range (0 to 2 * PI)
  const twoPi = range[1] - range[0];
  const result = normalized * twoPi;

  if (memoize) {
    stringToRangeMemoizedData[str] = result;
  }
  return result;
}