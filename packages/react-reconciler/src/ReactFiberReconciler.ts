import type { ReactNodeList } from "shared/ReactTypes";
import type { FiberRoot } from "./ReactInternalType";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

export function updateContainer(element: ReactNodeList, container: FiberRoot) {
  //! 1.获取current
  const current = container.current;
  current.memoizedState = { element };
  console.log(current);
  //! 2.调度更新
  scheduleUpdateOnFiber(container, current);
}
