//1.处理当前fiber，因为不同组件对应的fiber处理方式不同
//2.返回子节点

import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import {
  createFiberFromTypeAndProps,
  createWorkInProgress,
  isSimpleFunctionComponent,
} from "./ReactFiber";
import { renderWithHooks } from "./ReactFiberHooks";
import { pushProvider, readContext } from "./ReactFiberNewContext";
import type { Fiber } from "./ReactInternalType";
import {
  ClassComponent,
  ContextConsumer,
  ContextProvider,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
  MemoComponent,
  SimpleMemoComponent,
} from "./ReactWorkTags";
import { shallowEqual } from "shared/shallowEqual";
export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      return updateHostText(current, workInProgress);
    case Fragment:
      return updateHostFragment(current, workInProgress);
    case ClassComponent:
      return updateClassComponent(current, workInProgress);
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress);
    case ContextProvider:
      return updateContextProvider(current, workInProgress);
    case ContextConsumer:
      return updateContextConsumer(current, workInProgress);
    case MemoComponent:
      return updateMemoComponent(current, workInProgress);
    case SimpleMemoComponent:
      return updateSimpleMemoComponent(current, workInProgress);
    //todo
  }

  throw new Error(
    `Unkown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in` +
      "React. Please file an issue."
  );
}

//根fiber
function updateHostRoot(current: Fiber | null, workInProgress: Fiber) {
  const nextChildren = workInProgress.memoizedState.element;

  reconcileChildren(current, workInProgress, nextChildren);

  if (current) {
    current.child = workInProgress.child;
  }

  return workInProgress.child;
}

//原生标签，div、span等
//初次渲染 协调
//todo 更新 协调、bailout
function updateHostComponent(current: Fiber | null, workInProgress: Fiber) {
  const { type, pendingProps } = workInProgress;
  const isDirectTextChild = shouldSetTextContent(type, pendingProps);
  if (isDirectTextChild) {
    //文本属性
    return null;
  }
  //如果原生标签只有一个文本，这个时候文本不会再生成fiber节点，而是当做这个原生标签的属性

  const nextChildren = pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren);

  return workInProgress.child;
}

//文本没有子节点，不需要协调
function updateHostText(current: Fiber | null, workInProgress: Fiber) {
  return null;
}

//由于是Fragment故直接协调子节点即可
function updateHostFragment(current: Fiber | null, workInProgress: Fiber) {
  const nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

function updateClassComponent(current: Fiber | null, workInProgress: Fiber) {
  const { type, pendingProps } = workInProgress;
  const context = type.contextType;
  const newValue = readContext(context);
  let instance = workInProgress.stateNode;
  if (current === null) {
    instance = new type(pendingProps);
    workInProgress.stateNode = instance;
  }

  instance.context = newValue;
  const children = instance.render();
  reconcileChildren(current, workInProgress, children);

  return workInProgress.child;
}

function updateFunctionComponent(current: Fiber | null, workInProgress: Fiber) {
  const { type, pendingProps } = workInProgress;
  const children = renderWithHooks(current, workInProgress, type, pendingProps);
  reconcileChildren(current, workInProgress, children);
  return workInProgress.child;
}

function updateContextProvider(current: Fiber | null, workInProgress: Fiber) {
  const context = workInProgress.type._context;
  const value = workInProgress.pendingProps.value;

  //记录1.context、value到栈中   2.后代组件消费 3.消费完后出栈

  pushProvider(context, value);

  reconcileChildren(
    current,
    workInProgress,
    workInProgress.pendingProps.children
  );
  return workInProgress.child;
}

function updateContextConsumer(current: Fiber | null, workInProgress: Fiber) {
  const context = workInProgress.type;
  const newValue = readContext(context);

  const render = workInProgress.pendingProps.children;
  const newChildren = render(newValue);

  reconcileChildren(current, workInProgress, newChildren);
  return workInProgress.child;
}
function updateMemoComponent(current: Fiber | null, workInProgress: Fiber) {
  const Component = workInProgress.type;
  const type = Component.type;
  //组件是否是初次渲染
  if (current === null) {
    if (
      isSimpleFunctionComponent(type) &&
      Component.compare === null &&
      Component.defaultProps === undefined
    ) {
      workInProgress.type = type;
      workInProgress.tag = SimpleMemoComponent;
      return updateSimpleMemoComponent(current, workInProgress);
    }
    const child = createFiberFromTypeAndProps(
      type,
      null,
      workInProgress.pendingProps
    );
    child.return = workInProgress;
    workInProgress.child = child;
    return child;
  }

  //组件更新
  let compare = Component.compare;
  compare = compare !== null ? compare : shallowEqual;
  if (compare(current.memoizedProps, workInProgress.pendingProps)) {
    return bailoutAlreadyFinishedWork();
  }

  const newChild = createWorkInProgress(
    current.child as Fiber,
    workInProgress.pendingProps
  );

  newChild.return = workInProgress;
  workInProgress.child = newChild;
  return newChild;
}
function updateSimpleMemoComponent(
  current: Fiber | null,
  workInProgress: Fiber
) {
  if (current !== null) {
    if (shallowEqual(current.memoizedProps, workInProgress.pendingProps)) {
      return bailoutAlreadyFinishedWork();
    }
  }
  return updateFunctionComponent(current, workInProgress);
}

function bailoutAlreadyFinishedWork() {
  return null;
}

//协调子节点，构建新的fiber树
function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any
) {
  if (current === null) {
    //初次渲染
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    //更新
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}

export function shouldSetTextContent(type: string, props: any): boolean {
  return (
    type === "textarea" ||
    type === "noscript" ||
    typeof props.children === "string" ||
    typeof props.children === "number" ||
    typeof props.children === "bigint" ||
    (typeof props.dangerouslySetInnerHTML === "object" &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}
