import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalType";
import {
  ClassComponent,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./ReactWorkTags";

export function completeWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case Fragment:
    case ClassComponent:
    case FunctionComponent:
    case HostRoot: {
      return null;
    }
    case HostComponent: {
      //原生标签
      const { type } = workInProgress;
      if (current !== null && workInProgress.stateNode !== null) {
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        //1.创建真实DOM
        const instance = document.createElement(type);
        //2.初始化DOM属性
        finalizeInitialChildren(instance, null, newProps);
        //3.把子DOM挂载到父DOM上
        appendAllChildren(instance, workInProgress);
        if (
          workInProgress.return?.alternate?.deletions?.includes(workInProgress)
        ) {
        } else workInProgress.stateNode = instance;
      }
      return null;
    }
    case HostText: {
      workInProgress.stateNode = document.createTextNode(newProps);
      return null;
    }
    //todo
  }
  throw new Error(
    `Unkown unit of work tag(${workInProgress.tag}). This error is likely caused by a bug in` +
      "React. Please file an issue."
  );
}

function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  type: string,
  newProps: any
) {
  if (current?.memoizedProps === newProps) {
    return;
  }
  finalizeInitialChildren(
    workInProgress.stateNode,
    current?.memoizedProps,
    newProps
  );
}

//初始化/更新属性
function finalizeInitialChildren(
  domElement: Element,
  prevProps: any,
  nextProps: any
) {
  //遍历老的props
  for (const propKey in prevProps) {
    const prevProp = prevProps[propKey];
    if (propKey === "children") {
      if (isStr(prevProp) || isNum(prevProp)) {
        domElement.textContent = "";
      }
    } else {
      if (propKey === "onClick") {
        domElement.removeEventListener("click", prevProp);
      } else {
        if (!(prevProp in nextProps)) {
          (domElement as any)[propKey] = "";
        }
      }
    }
  }

  //遍历新的props
  for (const propKey in nextProps) {
    const nextProp = nextProps[propKey];
    if (propKey === "children") {
      if (isStr(nextProp) || isNum(nextProp)) {
        domElement.textContent = nextProp + "";
      }
    } else {
      if (propKey === "onClick") {
        domElement.addEventListener("click", nextProp);
      } else {
        (domElement as any)[propKey] = nextProp;
      }
    }
  }
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
  let nodeFiber = workInProgress.child;
  while (nodeFiber !== null) {
    if (isHost(nodeFiber)) {
      parent.appendChild(nodeFiber.stateNode); //DOM节点
    } else if (nodeFiber.child !== null) {
      nodeFiber = nodeFiber.child;
      continue;
    }

    if (nodeFiber === workInProgress) {
      return;
    }
    while (nodeFiber.sibling === null) {
      if (nodeFiber.return === null || nodeFiber.return === workInProgress) {
        return;
      }
      nodeFiber = nodeFiber.return;
    }
    nodeFiber = nodeFiber.sibling;
  }
}

export function isHost(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostText;
}
