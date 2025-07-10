import { isFn } from "shared/utils";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import type { Fiber, FiberRoot } from "./ReactInternalType";
import { HostRoot } from "./ReactWorkTags";
import { Passive, Update, type Flags } from "./ReactFiberFlags";
import { HookLayout, HookPassive, type HookFlags } from "./ReactHookEffectTags";
import { ReactContext } from "shared/ReactTypes";
import { readContext } from "./ReactFiberNewContext";

type Hook = {
  memoizedState: any;
  next: null | Hook;
};

type Effect = {
  tag: HookFlags;
  create: () => (() => void) | void;
  deps: Array<any> | void | null;
  next: Effect | null;
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
  workInProgress.updateQueue = null;
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
  reducer: ((state: S, action: A) => S) | null,
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
  scheduleUpdateOnFiber(root, fiber, true);
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

//源码中useState与useReducer对比
//useState，如果state没有改变，不引起组件更新。
//reducer代表state修改规则，useReducer适合复用
export function useState<S>(initialState: (() => S) | S) {
  const init = isFn(initialState) ? (initialState as any)() : initialState;
  return useReducer(null, init);
}

export function useMemo<T>(
  nextCreate: () => T,
  deps: Array<any> | void | null
) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;

  const prevState = hook.memoizedState;

  //检查依赖项是否变化
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1];
      if (areHookInputEqual(nextDeps, prevDeps)) {
        //依赖项没有变化，返回上一次计算结果
        return prevState[0];
      }
    }
  }
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];

  return nextValue;
}

export function useCallback<T>(callback: T, deps: Array<any> | void | null): T {
  const hook = updateWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;

  const prevState = hook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1];
      if (areHookInputEqual(nextDeps, prevDeps)) {
        //依赖项没有变化，返回上一次缓存的callback
        return prevState[0];
      }
    }
  }

  hook.memoizedState = [callback, nextDeps];

  return callback;
}

//检查hook依赖性是否改变
export function areHookInputEqual(
  nextDeps: Array<any>,
  prevDevs: Array<any> | null
): boolean {
  if (prevDevs === null) {
    return false;
  }

  for (let i = 0; i < prevDevs.length && nextDeps.length; ++i) {
    if (Object.is(nextDeps[i], prevDevs[i])) {
      continue;
    }
    return false;
  }
  return true;
}

export function useRef<T>(initialValue: T): { current: T } {
  const hook = updateWorkInProgressHook();
  if (currentHook === null) {
    hook.memoizedState = { current: initialValue };
  }
  return hook.memoizedState;
}

//useEffect与useLayoutEffect的区别
// * 存储结构一样
// * effect和destroy函数的执行时机不同
export function useLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<any> | void | null
) {
  return updateEffectImpl(Update, HookLayout, create, deps);
}
export function useEffect(
  create: () => (() => void) | void,
  deps: Array<any> | void | null
) {
  return updateEffectImpl(Passive, HookPassive, create, deps);
}

//存储effect
function updateEffectImpl(
  fiberFlags: Flags,
  hookFlag: HookFlags,
  create: () => (() => void) | void,
  deps: Array<any> | void | null
) {
  const hook = updateWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;
  if (currentHook !== null) {
    if (nextDeps !== null) {
      const prevDeps = hook.memoizedState.deps;
      if (prevDeps !== null) {
        if (areHookInputEqual(nextDeps, prevDeps)) {
          return;
        }
      }
    }
  }

  currentlyRenderingFiber!.flags |= fiberFlags;

  //1.保存effect 2.构建effect链表
  hook.memoizedState = pushEffect(hookFlag, create, nextDeps);
}

function pushEffect(
  tag: HookFlags,
  create: () => (() => void) | void,
  deps: Array<any> | void | null
) {
  const effect: Effect = {
    tag,
    create,
    deps,
    next: null,
  };

  let componentUpdateQueue = currentlyRenderingFiber!.updateQueue;
  //单向循环链表
  if (componentUpdateQueue === null) {
    //第一个effect
    componentUpdateQueue = {
      lastEffect: null,
    };
    currentlyRenderingFiber!.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    const firstEffect = lastEffect.next;
    lastEffect.next = effect;
    effect.next = firstEffect;
    componentUpdateQueue.lastEffect = effect;
  }

  return effect;
}

export function useContext<T>(context: ReactContext<T>): T {
  return readContext(context);
}
