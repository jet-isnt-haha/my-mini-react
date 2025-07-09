import { isHost } from "./ReactFiberCompleteWork";
import { ChildDeletion, Passive, Placement, Update } from "./ReactFiberFlags";
import { HookLayout, HookPassive, type HookFlags } from "./ReactHookEffectTags";
import type { Fiber, FiberRoot } from "./ReactInternalType";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./ReactWorkTags";

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
  if (flags & ChildDeletion) {
    const parentFiber = isHostParent(finishedWork)
      ? finishedWork
      : getHostParentFiber(finishedWork);

    const parentDOM = parentFiber.stateNode;
    commitDeletion(finishedWork.deletions!, parentDOM);
    finishedWork.flags &= ~ChildDeletion;
    finishedWork.deletions = null;
  }

  if (flags & Update) {
    if (finishedWork.tag === FunctionComponent) {
      //执行layout effect
      commitHookEffectListMount(HookLayout, finishedWork);
      finishedWork.flags &= ~Update;
    }
  }
}

function commitDeletion(
  deletions: Array<Fiber>,
  parentDOM: Element | Document | DocumentFragment
) {
  deletions.forEach((deletion) => {
    parentDOM.removeChild(getStateNode(deletion));
  });
}
function getStateNode(fiber: Fiber) {
  let node = fiber;
  while (1) {
    if (isHost(node) && node.stateNode) {
      return node.stateNode;
    }
    node = node.child as Fiber;
  }
}
function commitPlacement(finishedWork: Fiber) {
  if (finishedWork.stateNode && isHost(finishedWork)) {
    //finishedWork是有dom节点
    const domNode = finishedWork.stateNode;
    //找domNode的父DOM节点对应的fiber
    const parentNode = getHostParentFiber(finishedWork);
    let parentDOM = parentNode.stateNode;
    if (parentDOM.containerInfo) {
      parentDOM = parentDOM.containerInfo;
    }

    //遍历fiber，寻找finishedWork的兄弟节点，并且这个兄弟节点有dom节点，且是更新的节点。在本轮不发生移动
    const before = getHostSibling(finishedWork);
    insertOrAppendPlacementNode(finishedWork, before, parentDOM);
  } else {
    //Fragment
    let kid = finishedWork.child;
    while (kid !== null) {
      commitPlacement(kid);
      kid = kid.sibling;
    }
  }
}

function insertOrAppendPlacementNode(
  node: Fiber,
  before: Element,
  parent: Element
) {
  if (before) {
    parent.insertBefore(getStateNode(node), before);
  } else {
    parent.appendChild(getStateNode(node));
  }
}

function getHostSibling(fiber: Fiber) {
  let node = fiber;
  sibling: while (1) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }
    node = node.sibling;
    while (!isHost(node)) {
      //新增插入|移动位置
      if (node.flags & Placement) {
        continue sibling;
      }

      if (node.child === null) {
        continue sibling;
      } else {
        node = node.child;
      }
    }

    //HostComponent|HostText
    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
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

export function flushPassiveEffects(finishedWork: Fiber) {
  // !1. 遍历子节点，检查子节点
  recursivelyTraversePassiveMountEffects(finishedWork);
  // !2. 如果有passive effects 执行
  commitPassiveEffects(finishedWork);
}

function recursivelyTraversePassiveMountEffects(finishedWork: Fiber) {
  let child = finishedWork.child;
  while (child !== null) {
    // !1. 遍历子节点，检查子节点
    recursivelyTraversePassiveMountEffects(child);
    // !2. 如果有passive effects 执行
    commitPassiveEffects(finishedWork);
    child = child.sibling;
  }
}

function commitPassiveEffects(finishedWork: Fiber) {
  switch (finishedWork.tag) {
    case FunctionComponent: {
      if (finishedWork.flags & Passive) {
        commitHookEffectListMount(HookPassive, finishedWork);
        finishedWork.flags &= ~Passive;
      }
      break;
    }
  }
}

function commitHookEffectListMount(hookFlags: HookFlags, finishedWork: Fiber) {
  const updateQueue = finishedWork.updateQueue;
  let lastEffect = updateQueue!.lastEffect;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;

    do {
      if ((effect.tag & hookFlags) === hookFlags) {
        const create = effect.create;

        create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
