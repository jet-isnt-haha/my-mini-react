export function getCurrentTime(): number {
  return performance.now();
}

export function isStr(sth: any) {
  return typeof sth === "string";
}
