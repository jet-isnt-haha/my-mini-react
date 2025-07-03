import { ReactElement } from "../../shared/ReactTypes";
import { isStr } from "../../shared/utils";
import { Fiber } from "./ReactFiber";
import { NoFlags } from "./ReactFiberFlags";
import {
  HostComponent,
  IndeterminateComponent,
  WorkTag,
} from "./ReactWorkTags";

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
  this.sibiling = null;

  //记录节点在兄弟节点中的位置下标，用于diff时候判断节点是否发生移动
  this.index = 0;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;

  //不同组件的memoizedState指代也不同
  //函数组件hook0
  //类组件state
  this.memoizedState = null;

  //Effects
  this.flags = NoFlags;

  //缓存fiber
  this.alternate = null;
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
  if (isStr(type)) {
    //原生标签
    fiberTag = HostComponent;
  }

  const fiber = createFiber(fiberTag, pendingProps, key);
  fiber.elementType = type;
  fiber.type = type;
  return fiber;
}

export type Container = Element | Document | DocumentFragment;

export type FiberRoot = {
  containerInfo: Container;
  current: Fiber;
  //一个准备提交 work-in-progress，HostRoot
  finishedWork: Fiber | null;
};
