//1.处理当前fiber，因为不同组件对应的fiber处理方式不同
//2.返回子节点

import { Fiber } from "./ReactInternalType";

export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  return null;
}
