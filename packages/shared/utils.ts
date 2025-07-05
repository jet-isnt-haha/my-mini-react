export function getCurrentTime(): number {
  return performance.now();
}

export function isStr(sth: any) {
  return typeof sth === "string";
}

export function isNum(sth: any) {
  return typeof sth === "number";
}

export function isArray(sth: any) {
  return Array.isArray(sth);
}

export function isFn(sth: any) {
  return typeof sth === "function";
}
