// Utility type to extract all possible paths from a nested object type
type Join<K, P> = K extends string | number ?
  P extends string | number ?
    `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];

export type DeepKeys<T, D extends number = 10> = [D] extends [never] ? never : T extends object ?
  {
    [K in keyof T]-?: K extends string | number ?
      `${K}` | Join<K, DeepKeys<T[K], Prev[D]>>
      : never
  }[keyof T] : '';

// Helper to get the type at a given path
export type DeepValue<T, P extends string> = P extends `${infer K}.${infer Rest}` ?
  K extends keyof T ?
    DeepValue<T[K], Rest>
    : never
  : P extends keyof T ?
    T[P]
    : never;

// Runtime helper to get value at path
export function getDeepValue<T extends object>(obj: T, path: string): any {
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

// Runtime helper to set value at path
export function setDeepValue<T extends object>(obj: T, path: string, value: any): void {
  const keys = path.split('.');
  let current: any = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}