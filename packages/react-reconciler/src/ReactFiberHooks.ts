import type { Fiber } from "./ReactInternalType";

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
  workInProgress.memoizedProps = null;
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

export function useReducer<S, I, A>(
  reducer: (state: S, action: A) => S,
  initialArg: I,
  init?: (initialArg: I) => S
) {
  //! 1.构建hook链表
  const hook: Hook = { memoizedState: null, next: null };

  let initialState: S;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = initialArg as any;
  }

  //! 2.区分函数组件是初次挂载还是更新
  hook.memoizedState = initialState;

  //! 3.dispatch
  const dispatch = (action: A) => {
    const newValue = reducer(initialState, action);

    //scheduleUpdateOnFiber
    console.log("newValue", newValue);
  };

  hook.memoizedState = initialState;

  return [hook.memoizedState, dispatch];
}
