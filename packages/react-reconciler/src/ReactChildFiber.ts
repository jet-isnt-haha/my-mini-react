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
import { HostText } from "./ReactWorkTags";

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
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childToDelete);
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

  function updateSlot(
    returnFiber: Fiber,
    oldFiber: Fiber | null,
    newChild: any
  ) {
    //判断节点是否可以复用
    const key = oldFiber !== null ? oldFiber.key : null;
    if (isText(newChild)) {
      if (key !== null) {
        //新节点是文本，老节点不是文本
        return null;
      }
      //可能可以复用
      return updateTextNode(returnFiber, oldFiber, newChild + "");
    }

    if (typeof newChild === "object" && newChild !== null) {
      if (newChild.key === key) {
        return updateElement(returnFiber, oldFiber, newChild);
      } else {
        return null;
      }
    }

    if (isArray(newChild)) {
      if (key !== null) {
        return null;
      }
    }
    return null;
  }

  function updateElement(
    returnFiber: Fiber,
    current: Fiber | null,
    element: ReactElement
  ) {
    const elementType = element.type;
    if (current !== null) {
      if (current.elementType === elementType) {
        //类型相同
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }

    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function updateTextNode(
    returnFiber: Fiber,
    current: Fiber | null,
    textContent: string
  ) {
    if (current === null || current.tag !== HostText) {
      //判断老节点不是文本，则新增
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    } else {
      //老节点是文本
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }

  function placeChild(
    newFiber: Fiber,
    lastPlacedIndex: number, //记录的是新fiber在老fiber上的位置
    newIndex: number
  ) {
    newFiber.index = newIndex;

    if (!shouldTrackSideEffects) {
      return lastPlacedIndex;
    }

    //判断节点位置是否发生相对位置变化，是否需要移动
    const current = newFiber.alternate;
    if (current !== null) {
      const oldIndex = current.index;
      if (oldIndex < lastPlacedIndex) {
        //节点需要移动位置

        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        return oldIndex;
      }
    } else {
      //节点新增
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
  }
  function mapRemainingChildren(oldFiber: Fiber) {
    let existingChildren: Map<string | number, Fiber> = new Map();
    let existingChild: Fiber | null = oldFiber;
    while (existingChild !== null) {
      if (existingChild.key) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }

    return existingChildren;
  }

  function updateFromMap(
    existingChildren: Map<string | number, Fiber>,
    returnFiber: Fiber,
    newIndex: number,
    newChild: any
  ): Fiber | null {
    if (isText(newChild)) {
      const matchedFiber = existingChildren.get(newIndex) || null;
      return updateTextNode(returnFiber, matchedFiber, newChild + "");
    } else if (typeof newChild === "object" && newChild !== null) {
      const matchedFiber =
        existingChildren.get(newChild.key === null ? newIndex : newChild.key) ||
        null;

      return updateElement(returnFiber, matchedFiber, newChild);
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
    let nextOldFiber = null;
    let newIndex = 0;
    let lastPlacedIndex = 0;

    // 更新阶段
    //* 大多数情况，节点的相对位置不变
    //old 0 1 2 3 4
    //new 0 1 2 3

    //new 3 2 0 4 1
    //! 1.从左往右遍历，按位置比较，相同则复用。不能复用，则退出本轮

    for (; oldFiber !== null && newIndex < newChildren.length; newIndex++) {
      if (oldFiber.index > newIndex) {
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIndex]);
      if (newFiber === null) {
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }
        break;
      }

      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber?.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }

      //判断节点在DOM的相对位置是否发生变化

      //组件更新阶段，判断在更新前后的位置是否一致，如果不一致，需要移动

      lastPlacedIndex = placeChild(
        newFiber as Fiber,
        lastPlacedIndex,
        newIndex
      );

      if (previousNewFiber === null) {
        resultFirstChild = newFiber as Fiber;
      } else {
        previousNewFiber.sibling = newFiber as Fiber;
      }
      previousNewFiber = newFiber as Fiber;
      oldFiber = nextOldFiber;
    }

    //! 2.1 老节点有，新节点无。删除剩余老节点
    if (newIndex === newChildren.length) {
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultFirstChild;
    }

    //! 2.2 新节点有，老节点无。新增新节点
    //包括初次渲染
    if (oldFiber === null) {
      for (; newIndex < newChildren.length; ++newIndex) {
        const newFiber = createChild(returnFiber, newChildren[newIndex]);
        if (newFiber === null) {
          continue;
        }
        //用于组件更新阶段，判断在更新前后的位置是否一致，如果不一致，需要移动
        lastPlacedIndex = placeChild(
          newFiber as Fiber,
          lastPlacedIndex,
          newIndex
        );
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

    //!2.3 新老节点都还有

    //构建map
    const existingChildren = mapRemainingChildren(oldFiber);
    for (; newIndex < newChildren.length; ++newIndex) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIndex,
        newChildren[newIndex]
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          existingChildren.delete(
            newFiber.key === null ? newIndex : newFiber.key
          );
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);
        if (previousNewFiber === null) {
          resultFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }

    //! 新节点已构建完，但老节点仍然存在
    if (shouldTrackSideEffects) {
      existingChildren.forEach((child) => deleteChild(returnFiber, child));
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
