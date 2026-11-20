/**
 * Binary Min-Heap Priority Queue implementation in pure JavaScript.
 *
 * Used for Dijkstra's algorithm and A* search priority queues.
 * Maintains the min-heap property where parent <= children by priority.
 *
 * Time Complexities:
 *   - Insertion (push): O(log N)
 *   - Extraction (pop): O(log N)
 *   - Peek minimum: O(1)
 *   - Decrease key / update: O(log N) via index lookup map
 *   - Space: O(N)
 */

export class MinHeap {
  constructor() {
    /** @type {Array<{ id: string|number, priority: number, data?: any }>} */
    this.heap = [];
    /** @type {Map<string|number, number>} Map of element id to index in heap array */
    this.indexMap = new Map();
  }

  /**
   * Number of elements in the heap.
   * @returns {number}
   */
  get size() {
    return this.heap.length;
  }

  /**
   * Checks if heap is empty.
   * @returns {boolean}
   */
  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * Pushes a new element or updates priority if already present with lower cost.
   *
   * @param {string|number} id Unique identifier
   * @param {number} priority Priority value (lower = higher priority)
   * @param {any} [data] Optional payload
   */
  push(id, priority, data = null) {
    if (this.indexMap.has(id)) {
      this.decreaseKey(id, priority, data);
      return;
    }

    const node = { id, priority, data };
    this.heap.push(node);
    const index = this.heap.length - 1;
    this.indexMap.set(id, index);
    this._bubbleUp(index);
  }

  /**
   * Extracts and returns the minimum priority element.
   *
   * @returns {{ id: string|number, priority: number, data: any }|null}
   */
  pop() {
    if (this.isEmpty()) return null;

    const min = this.heap[0];
    this.indexMap.delete(min.id);

    const last = this.heap.pop();
    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      this.indexMap.set(last.id, 0);
      this._bubbleDown(0);
    }

    return min;
  }

  /**
   * Peeks at the minimum priority element without removing it.
   *
   * @returns {{ id: string|number, priority: number, data: any }|null}
   */
  peek() {
    return this.isEmpty() ? null : this.heap[0];
  }

  /**
   * Updates an existing element's priority if new priority is smaller.
   *
   * @param {string|number} id
   * @param {number} newPriority
   * @param {any} [newData]
   */
  decreaseKey(id, newPriority, newData = null) {
    const index = this.indexMap.get(id);
    if (index === undefined) return;

    if (newPriority < this.heap[index].priority) {
      this.heap[index].priority = newPriority;
      if (newData !== null) this.heap[index].data = newData;
      this._bubbleUp(index);
    }
  }

  /**
   * Checks if an ID currently resides in the heap.
   *
   * @param {string|number} id
   * @returns {boolean}
   */
  has(id) {
    return this.indexMap.has(id);
  }

  /**
   * Restores min-heap property upward from index.
   * @private
   * @param {number} index
   */
  _bubbleUp(index) {
    let current = index;
    const element = this.heap[current];

    while (current > 0) {
      const parentIndex = Math.floor((current - 1) / 2);
      const parent = this.heap[parentIndex];

      if (element.priority >= parent.priority) break;

      // Swap
      this.heap[current] = parent;
      this.indexMap.set(parent.id, current);

      current = parentIndex;
    }

    this.heap[current] = element;
    this.indexMap.set(element.id, current);
  }

  /**
   * Restores min-heap property downward from index.
   * @private
   * @param {number} index
   */
  _bubbleDown(index) {
    let current = index;
    const length = this.heap.length;
    const element = this.heap[current];

    while (true) {
      let leftChildIndex = 2 * current + 1;
      let rightChildIndex = 2 * current + 2;
      let swapIndex = -1;

      if (leftChildIndex < length) {
        if (this.heap[leftChildIndex].priority < element.priority) {
          swapIndex = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        const comparePriority = swapIndex === -1 ? element.priority : this.heap[leftChildIndex].priority;
        if (this.heap[rightChildIndex].priority < comparePriority) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === -1) break;

      this.heap[current] = this.heap[swapIndex];
      this.indexMap.set(this.heap[swapIndex].id, current);

      current = swapIndex;
    }

    this.heap[current] = element;
    this.indexMap.set(element.id, current);
  }
}
