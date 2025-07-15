import {
  DefaultEventPriority,
  EventPriority,
} from "react-reconciler/src/ReactEventPriorities";
import { getEventPriority } from "../events/ReactDOMEventListener";

export function getCurrentEventPriority(): EventPriority {
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type as any);
}
