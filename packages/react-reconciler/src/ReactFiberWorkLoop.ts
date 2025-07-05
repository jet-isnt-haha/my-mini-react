import { createFiber, createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { commitMutationEffects } from "./ReactFiberCommitWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import type { Fiber, FiberRoot } from "./ReactInternalType";

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

// Describes where we are in the React execution stack
let exectionContext: ExecutionContext = NoContext;

let workInProgress: Fiber | null = null; //当前正在工作的fiber
let workInProgressRoot: FiberRoot | null = null; //当前正在工作的root

export function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
  workInProgressRoot = root;
  workInProgress = fiber;

  ensureRootIsScheduled(root);
}

export function performConcurrentWorkOnRoot(root: FiberRoot) {
  //! 1.render，构建fiber树VDOM(beginWork|completeWork)
  renderRootSync(root);
  console.log("111", root);

  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;

  //! 2.commit，VDOM->DOM
  commitRoot(root);
}

function commitRoot(root: FiberRoot) {
  const prevExecutionContext = exectionContext;
  //! 1.commit阶段开始
  exectionContext |= CommitContext;
  //! 2.mutation阶段,渲染DOM树
  commitMutationEffects(root, root.finishedWork as Fiber);
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
  workInProgress = rootWorkInProgress; //Fiber

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
  let next = beginWork(current, unitOfWork);
  //1.1执行自己
  //1.2（协调，bailout）返回子节点
  if (next === null) {
    //没有产生新的work
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
