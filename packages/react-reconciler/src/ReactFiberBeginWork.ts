//1.处理当前fiber，因为不同组件对应的fiber处理方式不同
//2.返回子节点

import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { Fiber } from "./ReactInternalType";
import { HostComponent, HostRoot } from "./ReactWorkTags";

export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);

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
