import type { Fiber } from "react-reconciler/src/ReactInternalType";

type BaseSyntheticEvent = {
  isPersistent: () => boolean;
  isPropagationStopped: () => boolean;
  _targetInst: Fiber;
  nativeEvent: Event;
  target?: any;
  relatedTarget?: any;
  type: string;
  currentTarget: null | EventTarget;
};

export type KnownReactSyntheticEvent = BaseSyntheticEvent & {
  _reactName: string;
};

export type UnkownReactSyntheticEvent = BaseSyntheticEvent & {
  _reactName: null;
};

export type ReactSyntheticEvent =
  | KnownReactSyntheticEvent
  | UnkownReactSyntheticEvent;
