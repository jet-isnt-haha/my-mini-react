import type { Fiber } from "react-reconciler/src/ReactInternalType";
import type { DOMEventName } from "./DOMEventNames";
import {
  addEventBubbleListener,
  addEventCaptureListener,
} from "./EventListener";
import { allNativeEvents } from "./EventRegistry";
import { type EventSystemFlags, IS_CAPTURE_PHASE } from "./EventSystemFlags";

import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin";
import * as ChangeEventPlugin from "./plugins/ChangeEventPlugin";
import { createEventListenerWrapperWithPriority } from "./ReactDOMEventListener";
import { HostComponent } from "react-reconciler/src/ReactWorkTags";
import getListener from "./getListener";
import type { ReactSyntheticEvent } from "./ReactSyntheticEventType";

export type AnyNativeEvent = Event | KeyboardEvent | MouseEvent | TouchEvent;

export type DispatchListener = {
  instance: null | Fiber;
  listener: Function;
  currentTarget: EventTarget;
};

type DispatchEntry = {
  event: ReactSyntheticEvent;
  listeners: Array<DispatchListener>;
};

export type DispatchQueue = Array<DispatchEntry>;

export function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget
) {
  SimpleEventPlugin.extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );

  ChangeEventPlugin.extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );
}

SimpleEventPlugin.registerEvents();
ChangeEventPlugin.registerEvents();

// List of events that need to be individually attached to media elements.
export const mediaEventTypes: Array<DOMEventName> = [
  "abort",
  "canplay",
  "canplaythrough",
  "durationchange",
  "emptied",
  "encrypted",
  "ended",
  "error",
  "loadeddata",
  "loadedmetadata",
  "loadstart",
  "pause",
  "play",
  "playing",
  "progress",
  "ratechange",
  "resize",
  "seeked",
  "seeking",
  "stalled",
  "suspend",
  "timeupdate",
  "volumechange",
  "waiting",
];

// We should not delegate these events to the container, but rather
// set them on the actual target element itself. This is primarily
// because these events do not consistently bubble in the DOM.
export const nonDelegatedEvents: Set<DOMEventName> = new Set([
  "beforetoggle",
  "cancel",
  "close",
  "invalid",
  "load",
  "scroll",
  "scrollend",
  "toggle",
  // In order to reduce bytes, we insert the above array of media events
  // into this Set. Note: the "error" event isn't an exclusive media event,
  // and can occur on other elements too. Rather than duplicate that event,
  // we just take it from the media events array.
  ...mediaEventTypes,
]);

const listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
export function listenToAllSupportedEvents(rootContainerElement: EventTarget) {
  //防止重复绑定
  if (!(rootContainerElement as any)[listeningMarker]) {
    (rootContainerElement as any)[listeningMarker] = true;

    //事件绑定
    allNativeEvents.forEach((domEventName) => {
      //特殊处理 selectionchange
      if (domEventName !== "selectionchange") {
        //捕获、冒泡
        //有些事件在DOM上冒泡行为不一致，这些事件不做事件委托
        if (!nonDelegatedEvents.has(domEventName)) {
          listenToNativeEvent(domEventName, false, rootContainerElement);
        }
        listenToNativeEvent(domEventName, true, rootContainerElement);
      }
    });
  }
}

function listenToNativeEvent(
  domEventName: DOMEventName,
  isCapturePhaseListener: boolean,
  target: EventTarget
): void {
  let eventSystemFlags = 0;
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  );
}

function addTrappedEventListener(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  isCapturePhaseListener: boolean
) {
  //!1.获取对应事件，事件定义在ReactDOMEventListener中
  //如DiscreteEventPriority对应dispatchDiscreteEvent,ContinuousEventPriority对应dispatchContinuousEvent
  let listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags
  );

  //!2.绑定事件
  if (isCapturePhaseListener) {
    //! 捕获阶段
    addEventCaptureListener(targetContainer, domEventName, listener);
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener);
  }
}

export function accumulateSinglePhaseListeners(
  targetFiber: Fiber | null,
  reactName: string | null,
  nativeEventType: string,
  inCapturePhase: boolean,
  accumulateTargetOnly: boolean,
  nativeEvent: AnyNativeEvent
): Array<DispatchListener> {
  const captureName = reactName !== null ? reactName + "Capture" : null;
  const reactEventName = inCapturePhase ? captureName : reactName;

  let listeners: Array<DispatchListener> = [];

  let instance = targetFiber;

  // 通过target->root累积所有fiber和listeners.
  while (instance !== null) {
    const { stateNode, tag } = instance;
    //处理位于HostComponent上的listeners
    if (tag === HostComponent && stateNode !== null) {
      const listener = getListener(instance, reactEventName as string);
      if (listener !== null) {
        listeners.push({
          instance,
          listener,
          currentTarget: stateNode,
        });
      }
    }
    //如果只是为target累积事件，那么我们就不会通过React Fiber树传播以查找其它listeners
    if (accumulateTargetOnly) {
      break;
    }

    instance = instance.return;
  }
  return listeners;
}

export function accumulateTwoPhaseListeners(
  targetFiber: Fiber | null,
  reactName: string | null
): Array<DispatchListener> {
  const captureName = reactName !== null ? reactName + "Capture" : null;

  let listeners: Array<DispatchListener> = [];

  let instance = targetFiber;

  while (instance !== null) {
    const { stateNode, tag } = instance;
    if (tag === HostComponent && stateNode !== null) {
      const captureListener = getListener(instance, captureName as string);
      if (captureListener !== null) {
        //捕获阶段
        listeners.unshift({
          instance,
          listener: captureListener,
          currentTarget: stateNode,
        });

        const bubbleListener = getListener(instance, reactName as string);
        if (bubbleListener !== null) {
          //冒泡阶段
          listeners.unshift({
            instance,
            listener: bubbleListener,
            currentTarget: stateNode,
          });
        }
      }
    }
    instance = instance.return;
  }

  return listeners;
}
