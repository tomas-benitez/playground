export function returnOrThrow<T>(value: T, message?: string): NonNullable<T> {
  if (value !== undefined && value !== null) {
    return value;
  }

  throw new Error(message || "Value is undefined or null");
}
