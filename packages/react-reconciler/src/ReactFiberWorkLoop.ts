import { NormalPriority, Scheduler } from "scheduler";
import { createFiber, createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import {
  commitMutationEffects,
  flushPassiveEffects,
} from "./ReactFiberCommitWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import type { Fiber, FiberRoot } from "./ReactInternalType";
import { getCurrentUpdatePriority } from "./ReactEventPriorities";
import { claimNextTransitionLane, NoLane, type Lane } from "./ReactFiberLane";
import { getCurrentEventPriority } from "react-dom-bindings/src/events/ReactFiberConfigDOM";

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

// Describes where we are in the React execution stack
let exectionContext: ExecutionContext = NoContext;

let workInProgress: Fiber | null = null; //当前正在工作的fiber
let workInProgressRoot: FiberRoot | null = null; //当前正在工作的root
let workInProgressDeferredLane: Lane = NoLane;

export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  isSync?: boolean
) {
  workInProgressRoot = root;
  workInProgress = fiber;
  if (isSync) {
    queueMicrotask(() => performConcurrentWorkOnRoot(root));
  } else {
    ensureRootIsScheduled(root);
  }
}

export function performConcurrentWorkOnRoot(root: FiberRoot) {
  //! 1.render，构建fiber树VDOM(beginWork|completeWork)
  renderRootSync(root);
  const finishedWork = root.current.alternate;

  root.finishedWork = finishedWork;

  //! 2.commit，VDOM->DOM
  commitRoot(root);
}

function commitRoot(root: FiberRoot) {
  const prevExecutionContext = exectionContext;
  //! 1.commit阶段开始
  exectionContext |= CommitContext;
  //! 2.1.mutation阶段,渲染DOM树
  commitMutationEffects(root, root.finishedWork as Fiber);
  //! 2.2.passive effect阶段,执行useEffect
  Scheduler.scheduleCallback(NormalPriority, () => {
    flushPassiveEffects(root.finishedWork as Fiber);
  });
  //! 3.commit结束
  exectionContext = prevExecutionContext;
  workInProgressRoot = null;
}

function renderRootSync(root: FiberRoot) {
  const prevExecutionContext = exectionContext;
  //! 1.render阶段开始
  exectionContext |= RenderContext;
  //! 2.初始化
  prepareFreshStack(root);
  //! 3.遍历构建fiber树
  workLoopSync();

  //! 4.render结束
  exectionContext = prevExecutionContext;
  workInProgress = null;
}

function prepareFreshStack(root: FiberRoot): Fiber {
  root.finishedWork = null;
  workInProgressRoot = root; //FiberRoot
  const rootWorkInProgress = createWorkInProgress(root.current, null); //Fiber
  if (workInProgress === null) {
    workInProgress = rootWorkInProgress; //Fiber
  }

  return rootWorkInProgress;
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork: Fiber) {
  const current = unitOfWork.alternate || null;
  //! 1.beginWork
  /* 
    !beginWork 是“向下”阶段，创建或更新 Fiber 节点，协调子节点（通过 reconcileChildren），形成单链表结构。

    ?我对beginwork的理解：
    ?beginWork 创建的 Fiber 树是局部的（不完整的），每次只处理当前节点及其直接子节点。当遍历到最深的 child（unitOfWork.child === null）时，其兄弟节点的 Fiber 已由父节点的 reconcileChildren 创建，但兄弟节点的 child 尚未被 beginWork 处理，需等到 completeUnitOfWork 设置 workInProgress 为兄弟节点后再处理。
  */
  if (unitOfWork.key === "li4") {
    console.log(unitOfWork);
  }
  let next = beginWork(current, unitOfWork);

  //! 把pendingProps更新到memoizedProps
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  //1.1执行自己
  //1.2（协调，bailout）返回子节点
  if (next === null) {
    //没有产生新的work
    /* 
      !向上回溯阶段，完成 Fiber 节点的构建（通过 completeWork 创建 stateNode、处理副作用），处理兄弟节点（sibling）或父节点（return），补全 Fiber 树。

      ?我对completeUnitOfWork的理解：
    ?completeUnitOfWork更新 workInProgress，返回兄弟节点（触发 beginWork）或父节点，直到根节点（completedWork === null）。依赖 beginWork 补全兄弟节点的子树（sibling.child），仅完成当前节点和回溯路径的 DOM 和副作用，需多次迭代完成整个树。
    */
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
  //! 2.completeWork
}

//DFS
function completeUnitOfWork(unitOfWork: Fiber) {
  let completedWork = unitOfWork;

  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;

    let next = completeWork(current, completedWork);
    if (next !== null) {
      workInProgress = next;
      return;
    }

    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }

    completedWork = returnFiber!;
    workInProgress = completedWork;
  } while (completedWork !== null);
}

export function requestUpdateLane(): Lane {
  const updateLane = getCurrentUpdatePriority();
  if (updateLane !== NoLane) {
    return updateLane;
  }
  const eventLane: Lane = getCurrentEventPriority();

  return eventLane;
}

export function requestDeferredLane(): Lane {
  if (workInProgressDeferredLane === NoLane) {
    workInProgressDeferredLane = claimNextTransitionLane();
  }
  return workInProgressDeferredLane;
}
