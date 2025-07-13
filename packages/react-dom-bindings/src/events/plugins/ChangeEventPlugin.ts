import type { Fiber } from "react-reconciler/src/ReactInternalType";
import type { DOMEventName } from "../DOMEventNames";
import {
  type AnyNativeEvent,
  type DispatchQueue,
  accumulateTwoPhaseListeners,
} from "../DOMPluginEventSystem";
import { type EventSystemFlags } from "../EventSystemFlags";
import { SyntheticEvent } from "../SyntheticEvent";
import { registerTwoPhaseEvent } from "../EventRegistry";
import isTextInputElement from "../isTextInputElement";

function registerEvents() {
  registerTwoPhaseEvent("onChange", [
    "change",
    "click",
    "focusin",
    "focusout",
    "input",
    "keydown",
    "keyup",
    "selectionchange",
  ]);
}

function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget
): void {
  const targetNode = targetInst ? targetInst.stateNode : null;
  if (isTextInputElement(targetNode)) {
    if (domEventName === "input" || domEventName === "change") {
      const listeners = accumulateTwoPhaseListeners(targetInst, "onChange");
      if (listeners.length > 0) {
        const event = new (SyntheticEvent as any)(
          "onChange",
          "change",
          null,
          nativeEvent,
          nativeEventTarget
        );
        dispatchQueue.push({ event, listeners });
      }
    }
  }
}

export { registerEvents, extractEvents };
