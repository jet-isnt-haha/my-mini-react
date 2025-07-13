import type { Container } from "react-reconciler/src/ReactInternalType";
import { createFiberRoot } from "react-reconciler/src/ReactFiberRoot";
import type { FiberRoot } from "react-reconciler/src/ReactInternalType";
import type { ReactNodeList } from "shared/ReactTypes";
import { updateContainer } from "react-reconciler/src/ReactFiberReconciler";
import { listenToAllSupportedEvents } from "react-dom-bindings/src/events/DOMPluginEventSystem";
type RootType = {
  render: (children: ReactNodeList) => void;
  _internalRoot: FiberRoot;
};

function ReactDOMRoot(_internalRoot: FiberRoot) {
  this._internalRoot = _internalRoot;
}

ReactDOMRoot.prototype.render = function (children: ReactNodeList): void {
  const root = this._internalRoot;
  updateContainer(children, root);
};

export function createRoot(container: Container): RootType {
  const root: FiberRoot = createFiberRoot(container);

  listenToAllSupportedEvents(container);
  return new ReactDOMRoot(root);
}
export default {
  createRoot,
};
