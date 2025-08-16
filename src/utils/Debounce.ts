/* eslint-disable @typescript-eslint/no-explicit-any */

export default function DebounceCancelPrevious(wait: number) {
  return function (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
  ) {
    const originalMethod = descriptor.value!;
    let timer: number | null = null;
    let currentPromise: Promise<any> | null = null;

    descriptor.value = function (...args: any[]): Promise<any> {
      if (timer !== null) clearTimeout(timer);

      currentPromise = new Promise<any>((resolve, reject) => {
        timer = window.setTimeout(async () => {
          timer = null;
          try {
            const result = await originalMethod.apply(this, args);
            resolve(result);
          } catch (err) {
            reject(err);
          } finally {
            currentPromise = null;
          }
        }, wait);
      });

      return currentPromise;
    };
  };
}
