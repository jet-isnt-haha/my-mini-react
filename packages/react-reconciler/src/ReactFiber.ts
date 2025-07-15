import {
  ClassComponent,
  ContextConsumer,
  ContextProvider,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostText,
  IndeterminateComponent,
  MemoComponent,
  type WorkTag,
} from "./ReactWorkTags";
import { NoFlags } from "./ReactFiberFlags";

import type { ReactElement } from "shared/ReactTypes";
import { isFn, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalType";
import {
  REACT_CONTEXT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_MEMO_TYPE,
  REACT_PROVIDER_TYPE,
} from "shared/ReactSymbols";
import { NoLane, NoLanes } from "./ReactFiberLane";

//创建第一个fiber
export function createFiber(
  tag: WorkTag,
  pendingProps: any,
  key: null | string
): Fiber {
  return new FiberNode(tag, pendingProps, key);
}
function FiberNode(tag: WorkTag, pendingProps: any, key: null | string) {
  //标记组件类型
  this.tag = tag;

  //定义组件当前层级下的唯一性
  this.key = key;

  //组件类型
  this.elementType = null;

  //组件类型
  this.type = null;

  //不同的组件的stateNode定义不同
  //原生标签：string
  //类标签：实例
  this.stateNode = null;

  //Fiber
  this.return = null;
  this.child = null;
  this.sibling = null;

  //记录节点在兄弟节点中的位置下标，用于diff时候判断节点是否发生移动
  this.index = 0;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;

  //不同组件的指代也不同
  //函数组件hook0
  //类组件state
  this.memoizedState = null;

  //Effects
  this.flags = NoFlags;

  //缓存fiber
  this.alternate = null;

  this.deletions = null;

  this.updateQueue = null;

  this.lanes = NoLanes;
  this.childLanes = NoLanes;
}

//根据ReactElement创建fiber
export function createFiberFromElement(element: ReactElement) {
  const { type, key } = element;
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(type, key, pendingProps);
  return fiber;
}

//根据TypeAndProps创建fiber
export function createFiberFromTypeAndProps(
  type: any,
  key: null | string,
  pendingProps: any
) {
  let fiberTag: WorkTag = IndeterminateComponent;
  if (isFn(type)) {
    //函数组件、类组件
    if (type.prototype.isReactComponent) {
      fiberTag = ClassComponent;
    } else {
      fiberTag = FunctionComponent;
    }
  } else if (isStr(type)) {
    //原生标签
    fiberTag = HostComponent;
  } else if (type === REACT_FRAGMENT_TYPE) {
    fiberTag = Fragment;
  } else if (type.$$typeof === REACT_PROVIDER_TYPE) {
    fiberTag = ContextProvider;
  } else if (type.$$typeof === REACT_CONTEXT_TYPE) {
    fiberTag = ContextConsumer;
  } else if (type.$$typeof === REACT_MEMO_TYPE) {
    fiberTag = MemoComponent;
  }

  const fiber = createFiber(fiberTag, pendingProps, key);
  fiber.elementType = type;
  fiber.type = type;
  return fiber;
}

export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    //双缓存
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;

    workInProgress.flags = NoFlags;
  }

  workInProgress.flags = current.flags;
  workInProgress.lanes = current.lanes;
  workInProgress.childLanes = current.childLanes;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  return workInProgress;
}

export function createFiberFromText(content: string): Fiber {
  const fiber = createFiber(HostText, content, null);
  return fiber;
}

function shouldConstruct(Component: Function) {
  const prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

export function isSimpleFunctionComponent(type: any): boolean {
  return (
    typeof type === "function" &&
    !shouldConstruct(type) &&
    type.defalutProps === undefined
  );
}
