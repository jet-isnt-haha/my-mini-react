import { Placement } from "./ReactFiberFlags";
import { Fiber, FiberRoot } from "./ReactInternalType";
import { HostComponent, HostRoot } from "./ReactWorkTags";

export function commitMutationEffects(root: FiberRoot, finishedWork: Fiber) {
  // 1.遍历
  recursivelyTraverseMutationEffects(root, finishedWork);
  commitReconciliationEffects(finishedWork);
}

function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber
) {
  let child = parentFiber.child;
  //遍历单链表
  while (child !== null) {
    commitMutationEffects(root, child);
    child = child.sibling;
  }
}

function commitReconciliationEffects(finishedWork: Fiber) {
  const flags = finishedWork.flags;
  if (flags & Placement) {
    //页面初次渲染，新增插入appendChild
    //todo 页面更新，修改位置appendChild||insertBefore
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }
}

function commitPlacement(finishedWork: Fiber) {
  if (finishedWork.stateNode && finishedWork.tag === HostComponent) {
    //finishedWork是有dom节点
    const domNode = finishedWork.stateNode;
    //找domNode的父DOM节点对应的fiber
    const parentNode = getHostParentFiber(finishedWork);
    let parentDOM = parentNode.stateNode;
    if (parentDOM.containerInfo) {
      parentDOM = parentDOM.containerInfo;
    }
    parentDOM.appendChild(domNode);
  }
}

function getHostParentFiber(finishedWork: Fiber): Fiber {
  let parent = finishedWork.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }

  throw new Error(
    "Expect to find a host parent. This error is likely caused by a bug " +
      "in React. Please file an issue."
  );
}

//检查fiber是HostParent
function isHostParent(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}
