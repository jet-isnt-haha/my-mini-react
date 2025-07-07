import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import type { Fiber } from "./ReactInternalType";
import type { ReactElement } from "shared/ReactTypes";
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from "./ReactFiber";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import { isArray } from "shared/utils";

type ChildReconciler = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any
) => Fiber | null;

export const reconcileChildFibers: ChildReconciler =
  createChildReconciler(true);

export const mountChildFibers: ChildReconciler = createChildReconciler(false);

//协调子节点
function createChildReconciler(
  shouldTrackSideEffects: boolean
): ChildReconciler {
  //给fiber节点添加flags
  function placeSingeChild(newFiber: Fiber) {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  function useFiber(fiber: Fiber, pendingProps: any): Fiber {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  //协调单个子节点，对于页面初次渲染，创建fiber，不对比复用老节点
  function reconcileSingeElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    element: ReactElement
  ) {
    //! 节点复用条件：1.同一层级下 2.key相同 3.类型相同
    const key = element.key;
    let child = currentFirstChild;
    while (child !== null) {
      if (child.key === key) {
        const elementType = element.type;
        if (child.type === elementType) {
          //todo child后的其他fiber可以删除
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        } else {
          //前提：React不认为同一层级下有两个相同的key值
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        //todo
        //删除单个节点
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    let createFiber = createFiberFromElement(element);
    createFiber.return = returnFiber;
    return createFiber;
  }

  function deleteRemainingChildren(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null
  ): null {
    if (!shouldTrackSideEffects) {
      return null;
    }
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }

  function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
    if (!shouldTrackSideEffects) {
      return;
    }
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags = ChildDeletion;
    } else {
      returnFiber.deletions!.push(childToDelete);
    }
  }

  function createChild(returnFiber: Fiber, newChild: any): Fiber | null {
    if (isText(newChild)) {
      const created = createFiberFromText(newChild + "");
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
      }
    }
    return null;
  }

  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: Array<any>
  ): Fiber | null {
    let resultFirstChild: Fiber | null = null; //头节点
    let previousNewFiber: Fiber | null = null;
    let oldFiber = currentFirstChild;
    let newIndex = 0;

    //初次渲染
    if (oldFiber === null) {
      for (; newIndex < newChildren.length; ++newIndex) {
        const newFiber = createChild(returnFiber, newChildren[newIndex]);
        if (newFiber === null) {
          continue;
        }
        //用于组件更新阶段，判断在更新前后的位置是否一致，如果不一致，需要移动
        newFiber.index = newIndex;
        if (previousNewFiber === null) {
          resultFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      //下一个兄弟节点

      return resultFirstChild;
    }
    return resultFirstChild;
  }

  function reconcileSingleTextNode(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    textContent: string
  ) {
    const created = createFiberFromText(textContent);
    created.return = returnFiber;
    return created;
  }

  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any
  ) {
    //检查newChild类型是否为文本
    if (isText(newChild)) {
      return placeSingeChild(
        reconcileSingleTextNode(returnFiber, currentFirstChild, newChild + "")
      );
    }

    //检查newChild类型是否为单个节点
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          return placeSingeChild(
            reconcileSingeElement(returnFiber, currentFirstChild, newChild)
          );
        }
      }
    }

    //检查newChild是否为数组
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
    }

    return null;
  }

  return reconcileChildFibers;
}

function isText(newChild: any) {
  return (
    (typeof newChild === "string" && newChild !== "") ||
    typeof newChild === "number"
  );
}
