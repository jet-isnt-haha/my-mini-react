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
      //1.创建真实DOM
      const instance = document.createElement(type);
      //2.初始化DOM属性
      finalizeInitialChildren(instance, newProps);
      //3.把子DOM挂载到父DOM上
      appendAllChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
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

function finalizeInitialChildren(domElement: Element, props: any) {
  for (const propKey in props) {
    const nextProp = props[propKey];
    if (propKey === "children") {
      if (isStr(nextProp) || isNum(nextProp)) {
        domElement.textContent = String(nextProp);
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
  console.log(nodeFiber);
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
