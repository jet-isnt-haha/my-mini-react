import { Fiber } from "./ReactFiber";
import { Container, createFiber, FiberRoot } from "./ReactInternalType";
import { HostRoot } from "./ReactWorkTags";

export function createFiberRoot(containerInfo: Container): FiberRoot {
  const root: FiberRoot = new FiberRootNode(containerInfo);
  const uninitializedFiber: Fiber = createFiber(HostRoot, null, null);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;
  return root;
}

export function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo;
  this.current = null;
  this.finishedWork = null;
}
