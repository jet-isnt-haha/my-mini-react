// 实现一个单线程任务调度器
import {
  NoPriority,
  PriorityLevel,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  IdlePriority,
  LowPriority,
} from "./SchedulerPriorities";
import { peek, pop, push } from "./SchedulerMinHeap";
import { getCurrentTime } from "../../shared/utils";
import {
  lowPriorityTimeout,
  maxSigned31BigtInt,
  normalPriorityTimeout,
  userBlockingPriorityTimeout,
} from "./SchedulerFeatureFlags";

// type Callback = (arg: boolean) => Callback | null | undefined;
type Callback = (args: any) => void | any;
export type Task = {
  id: number;
  callback: Callback | null;
  priorityLevel: PriorityLevel;
  startTime: number;
  expirationTime: number;
  sortIndex: number;
};

//任务池，最小堆
const taskQueue: Array<Task> = [];

//标记task的唯一性
let taskCounter = 1;

let currentTask: Task | null = null;
let currentPriorityLevel: PriorityLevel = NoPriority;

//记录时间切片的起始值，时间戳
let startTime = -1;

//时间切片，这是个时间段
let frameInterval = 5;

//是否有work在执行
let isPerformingWork = false;

//主线程是否在调度
let isHostCallbackScheduled = false;

let isMessageLoopRunning = false;

//任务调度器的入口函数
function scheduleCallback(priorityLevel: PriorityLevel, callback: Callback) {
  //任务进入调度器的时间
  const startTime = getCurrentTime();
  let timeout: number;
  switch (priorityLevel) {
    case ImmediatePriority:
      //立即超时
      timeout = -1;
      break;
    case UserBlockingPriority:
      //最终超时
      timeout = userBlockingPriorityTimeout;
      break;
    case IdlePriority:
      //永不超时
      timeout = maxSigned31BigtInt;
      break;
    case LowPriority:
      //最终超时
      timeout = lowPriorityTimeout;
    case NoPriority:
    default:
      //最终超时
      timeout = normalPriorityTimeout;
      break;
  }

  const expirationTime = startTime + timeout;
  let newTask: Task = {
    callback,
    priorityLevel,
    id: taskCounter++,
    startTime,
    expirationTime,
    sortIndex: -1,
  };

  newTask.sortIndex = expirationTime;
  push(taskQueue, newTask);

  if (!isHostCallbackScheduled && !isPerformingWork) {
    isHostCallbackScheduled = true;
    requestHostCallback();
  }
}

//React使用MessageChannel创建宏任务，来实现异步任务队列，以实现异步更新，确保React在执行更新时能够合并多个更新操作，并在下一个宏任务中一次性更新，以提高性能并减少不必要的重复渲染，从而提高页面性能和用户体验。（ps：不使用settimeout来模拟宏队列的原因是其具有最小延迟时间4ms，不适合模拟宏队列）
function requestHostCallback() {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

function performWorkuntilDeadline() {
  if (isMessageLoopRunning) {
    const currentTime = getCurrentTime();
    // 记录一个work的起始时间，其实就是一个时间切片的起始时间，即为一个时间戳
    startTime = currentTime;
    let hasMoreWork = true;
    try {
      hasMoreWork = flushWork(currentTime);
    } finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
      }
    }
  }
}

const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkuntilDeadline;

function schedulePerformWorkUntilDeadline() {
  port.postMessage(null);
}

function flushWork(initialTime: number) {
  isHostCallbackScheduled = false;
  isPerformingWork = true;

  let previousPriorityLevel = currentPriorityLevel;
  try {
    return workLoop(initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}

//取消某个任务，由于最小堆没法直接删除，因此只能初步把task.callback 设置为null
//调度过程中，当这个任务位于堆顶时，删掉
function cancelCallback() {
  currentTask!.callback = null;
}

function getCurrentPriorityLevel(): PriorityLevel {
  return currentPriorityLevel;
}

function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;

  if (timeElapsed < frameInterval) {
    return false;
  }
  return true;
}

// 有很多task，每个task都有一个callback，callback执行结束，就执行下一个task
// 一个work就是一个时间切片内执行的一些task
// 时间切片要循环，就是work要循环（loop）
// 返回为true，表示还有任务没有执行完，需要继续执行
function workLoop(initialTime: number): boolean {
  let currentTime = initialTime;
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }

    //执行任务
    const callback = currentTask.callback;
    if (typeof callback === "function") {
      //有效任务
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);

      if (typeof continuationCallback === "function") {
        currentTask.callback = continuationCallback;
        return true;
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
      }
    } else {
      // 无效任务
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  if (currentTask !== null) {
    return true;
  } else {
    return false;
  }
}

export {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  IdlePriority,
  LowPriority,
  scheduleCallback,
  cancelCallback,
  getCurrentPriorityLevel,
  shouldYieldToHost as shouldYield,
};
