import type { Fiber } from "react-reconciler/src/ReactInternalType";

const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = "_reactFiber$" + randomKey;
const internalPropKey = "_reactProps$" + randomKey;

export function precacheFiberNode(hostInst: Fiber, node: Element | Text): void {
  (node as any)[internalInstanceKey] = hostInst;
}

export function getClosestInstanceFromNode(targetNode: Node): null | Fiber {
  let targetInst = (targetNode as any)[internalInstanceKey];
  if (targetInst) {
    return targetInst;
  }
  return null;
}

export function getFiberCurrentPropsFromNode(node: Element | Text) {
  return (node as any)[internalPropKey] || null;
}

export function updateFiberProps(node: Element | Text, props: any): void {
  (node as any)[internalPropKey] = props;
}
