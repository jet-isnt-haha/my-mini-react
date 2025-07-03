import { NormalPriority, Scheduler } from "scheduler";
import { FiberRoot } from "./ReactInternalType";
import { performConcurrentWorkOnRoot } from "./ReactFiberWorkLoop";

export function ensureRootIsScheduled(root: FiberRoot) {
  //将微任务加入队列以在控制返回浏览器的事件循环之前的安全时间执行
  queueMicrotask(() => {
    scheduleTaskForRootDuringMircotask(root);
  });
}

//作为微任务的callback函数进行调用
function scheduleTaskForRootDuringMircotask(root: FiberRoot) {
  const schedulerPriorityLevel = NormalPriority;
  Scheduler.scheduleCallback(
    schedulerPriorityLevel,
    //第二个参数是执行函数callback
    performConcurrentWorkOnRoot.bind(null, root)
  );
}
