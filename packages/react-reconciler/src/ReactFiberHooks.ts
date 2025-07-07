import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import type { Fiber, FiberRoot } from "./ReactInternalType";
import { HostRoot } from "./ReactWorkTags";

type Hook = {
  memoizedState: any;
  next: null | Hook;
};

//当前正在工作的函数组件的fiber
let currentlyRenderingFiber: Fiber | null = null;

//当前正在工作的hook
let workInProgressHook: Hook | null = null;

//旧的hook
let currentHook: Hook | null = null;

export function renderWithHooks<Props>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  props: Props
): any {
  currentlyRenderingFiber = workInProgress;
  workInProgress.memoizedState = null;
  let children = Component(props);

  finishRenderingHooks();

  return children;
}

//
function finishRenderingHooks() {
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
}

//1.返回当前useX函数对应的hook
//2.构建hook链表
function updateWorkInProgressHook(): Hook {
  let hook: Hook;

  const current = currentlyRenderingFiber?.alternate;

  if (current) {
    //update阶段(mount、update)
    currentlyRenderingFiber!.memoizedState = current.memoizedState;
    if (workInProgressHook) {
      workInProgressHook = hook = workInProgressHook.next!;
      currentHook = currentHook?.next as Hook;
    } else {
      hook = workInProgressHook = currentlyRenderingFiber!.memoizedState;
      currentHook = current.memoizedState;
    }
  } else {
    //mount阶段
    currentHook = null;
    hook = {
      memoizedState: null,
      next: null,
    };
    if (workInProgressHook) {
      workInProgressHook = workInProgressHook.next = hook;
    } else {
      //hook单链表的头节点
      workInProgressHook = currentlyRenderingFiber!.memoizedState = hook;
    }
  }

  return hook;
}

export function useReducer<S, I, A>(
  reducer: (state: S, action: A) => S,
  initialArg: I,
  init?: (initialArg: I) => S
) {
  //! 1.构建hook链表
  const hook: Hook = updateWorkInProgressHook();

  let initialState: S;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = initialArg as any;
  }

  //! 2.区分函数组件是初次挂载还是更新
  if (!currentlyRenderingFiber?.alternate) {
    //mount
    hook.memoizedState = initialState;
  }

  //! 3.dispatch (ps:个人理解，dispatchReducerAction.bind(null, currentlyRenderingFiber, hook, reducer) 是 useReducer 的 dispatch 函数实现，使用闭包通过 bind 绑定当前组件的 Fiber 节点（currentlyRenderingFiber）、Hook 对象（hook）和 reducer 函数。这种绑定确保 dispatch 在任何时间调用时都能访问正确的上下文，形成稳定的函数引用，防止渲染过程中上下文变化导致错误。)
  const dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber!,
    hook,
    reducer as any
  );

  return [hook.memoizedState, dispatch];
}

function dispatchReducerAction<S, A>(
  fiber: Fiber,
  hook: Hook,
  reducer: (state: S, action: A) => S,
  action: any
) {
  //使其与useState方法通用
  hook.memoizedState = reducer ? reducer(hook.memoizedState, action) : action;

  fiber.alternate = { ...fiber };

  const root = getRootForUpdateFiber(fiber);

  //准备调度更新
  scheduleUpdateOnFiber(root, fiber);
}

function getRootForUpdateFiber(sourceFiber: Fiber): FiberRoot {
  let node = sourceFiber;
  let parent = node.return;

  while (parent !== null) {
    node = parent;
    parent = node.return;
  }

  if (node.tag === HostRoot) {
    return node.stateNode;
  } else {
    throw new Error("Root fiber not found or is not HostRoot.");
  }
}
