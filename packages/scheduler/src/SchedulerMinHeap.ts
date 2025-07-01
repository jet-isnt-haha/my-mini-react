export type Heap<T extends Node> = Array<T>;
export type Node = {
  id: number; //任务的唯一标识
  sortIndex: number; //排序依据
};

export function peek<T extends Node>(heap: Heap<T>): T | null {
  return heap.length === 0 ? null : heap[0];
}

export function push<T extends Node>(heap: Heap<T>, node: T): void {
  //1.把node放在堆的最后
  const index = heap.length;
  heap.push(node);

  //2.调整最小堆，从下往上堆化
  siftUp(heap, index);
}

//上浮调整最小堆
function siftUp<T extends Node>(heap: Heap<T>, i: number): void {
  let index = i;

  while (index > 0) {
    const parentIndex = (index - 1) >>> 2;
    if (compare(heap[parentIndex], heap[index]) > 0) {
      [heap[parentIndex], heap[index]] = [heap[index], heap[parentIndex]];
      index = parentIndex;
    } else {
      return;
    }
  }
}

export function pop<T extends Node>(heap: Heap<T>): T | null {
  if (heap.length === 0) {
    return null;
  }

  const first = heap[0];
  const last = heap.pop()!;
  if (first !== last) {
    //证明heap中有两个或者更多元素
    heap[0] = last;

    siftDown(heap, last, 0);
  }
  return first;
}

function siftDown<T extends Node>(heap: Heap<T>, node: T, i: number): void {
  let index = i;
  const length = heap.length;
  const halfLength = length >>> 1;
  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];

    if (compare(left, node) < 0) {
      if (rightIndex < length && compare(left, right) < 0) {
        //right<left
        [heap[index], heap[rightIndex]] = [heap[rightIndex], heap[index]];
        index = rightIndex;
      } else {
        //right不存在或left更小
        [heap[index], heap[leftIndex]] = [heap[leftIndex], heap[index]];
        index = leftIndex;
      }
    } else if (rightIndex < length && compare(right, node) < 0) {
      //left>=node && right<node
      [heap[index], heap[rightIndex]] = [heap[rightIndex], heap[index]];
      index = rightIndex;
    } else {
      return;
    }
  }
}

const compare = (a: Node, b: Node) => {
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
};
