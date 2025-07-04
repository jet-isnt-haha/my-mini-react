import { isNum, isStr } from "shared/utils";
import { Fiber } from "./ReactInternalType";
import { HostComponent, HostRoot } from "./ReactWorkTags";

export function completeWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  switch (workInProgress.tag) {
    case HostRoot:
      return null;
    case HostComponent: {
      //原生标签
      const { type } = workInProgress;
      //1.创建真实DOM
      const instance = document.createElement(type);
      //2.初始化DOM属性
      finalizeInitialChildren(instance, workInProgress.pendingProps);
      //3.把子DOM挂载到父DOM上
      appendAllChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
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
      domElement[propKey] = nextProp;
    }
  }
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
  let nodeFiber = workInProgress.child;
  console.log(nodeFiber);
  if (nodeFiber) {
    parent.appendChild(nodeFiber.stateNode);
  }
}
