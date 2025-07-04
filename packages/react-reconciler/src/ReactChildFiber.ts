import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { Fiber } from "./ReactInternalType";
import { ReactElement } from "shared/ReactTypes";
import { createFiberFromElement } from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";

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

  //协调单个子节点，对于页面初次渲染，创建fiber，不对比复用老节点
  function reconcileSingeElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: ReactElement
  ) {
    let createFiber = createFiberFromElement(newChild);
    createFiber.return = returnFiber;
    return createFiber;
  }

  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any
  ) {
    //检查newChild类型，单个节点、文本、数组
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          return placeSingeChild(
            reconcileSingeElement(returnFiber, currentFirstChild, newChild)
          );
        }
      }
    }
    //todo
    return null;
  }

  return reconcileChildFibers;
}
