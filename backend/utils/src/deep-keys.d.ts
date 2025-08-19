type Join<K, P> = K extends string | number ? P extends string | number ? `${K}${'' extends P ? '' : '.'}${P}` : never : never;
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];
export type DeepKeys<T, D extends number = 10> = [D] extends [never] ? never : T extends object ? {
    [K in keyof T]-?: K extends string | number ? `${K}` | Join<K, DeepKeys<T[K], Prev[D]>> : never;
}[keyof T] : '';
export type DeepValue<T, P extends string> = P extends `${infer K}.${infer Rest}` ? K extends keyof T ? DeepValue<T[K], Rest> : never : P extends keyof T ? T[P] : never;
export declare function getDeepValue<T extends object>(obj: T, path: string): any;
export declare function setDeepValue<T extends object>(obj: T, path: string, value: any): void;
export {};
