import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import { Fiber, FiberRoot } from "./ReactInternalType";

let workInProgress: Fiber | null = null; //当前正在工作的fiber
let workInProgressRoot: FiberRoot | null = null; //当前正在工作的root

export function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
  workInProgressRoot = root;
  workInProgress = fiber;

  ensureRootIsScheduled(root);
}

export function performConcurrentWorkOnRoot(root: FiberRoot) {
  //! 1.render，构建fiber树VDOM
  //! 2.commit，VDOM->DOM
}
