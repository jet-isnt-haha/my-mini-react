import { NormalPriority, Scheduler } from "scheduler";
import { FiberRoot } from "./ReactInternalType";
import { performConcurrentWorkOnRoot } from "./ReactFiberWorkLoop";

export function ensureRootIsScheduled(root: FiberRoot) {
  //将微任务加入队列以在控制返回浏览器的事件循环之前的安全时间执行
  /* 
    微任务队列总结：
    queueMicrotask 是 JavaScript 提供的一种将任务加入微任务队列的 API。微任务会在当前宏任务（例如事件处理或主线程执行）完成后、事件循环进入下一个宏任务之前执行。React 使用 queueMicrotask 的原因有以下几点：
    ! 1.尽早安排调度： React的更新通常再事件处理或用户代码中触发。这些操作允许在当前的事件循环的宏任务中。 React需要在宏任务结束之前，尽快安排调度工作。使用微任务保证会在当前宏任务的同步代码执行完成后、浏览器重新获得控制权之前运行。

    ! 2.避免阻塞主线程

    ! 3.统一调度入口： React的Fiber架构允许多个更新在同一事件循环中触发。微任务提供一个统一的入口，让React在微任务阶段检查所有待处理的更新，并决定如何调度它们。

    ? 我的理解：微任务的作用是在每次宏任务结束后（既有浏览器主线程结束后又有调度器渲染后）的对优先级lane进行检查与合并（这里fiber的lane到调度器中转换成对应的priority），然后将新的最高的优先级与渲染函数开始调度，进入新的宏任务队列进行渲染）
  */
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
