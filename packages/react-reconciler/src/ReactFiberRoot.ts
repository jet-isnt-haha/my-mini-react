import { createFiber } from "./ReactFiber";
import type { Container, FiberRoot, Fiber } from "./ReactInternalType";
import { HostRoot } from "./ReactWorkTags";

export function createFiberRoot(containerInfo: Container): FiberRoot {
  const root: FiberRoot = new FiberRootNode(containerInfo);
  const uninitializedFiber: Fiber = createFiber(HostRoot, null, null);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;
  return root;
}

export function FiberRootNode(containerInfo: Container) {
  this.containerInfo = containerInfo;
  this.current = null;
  this.finishedWork = null;
}
