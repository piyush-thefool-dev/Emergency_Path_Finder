import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function expect(actual) {
  return {
    toBe(expected) { assert.equal(actual, expected); },
    toEqual(expected) { assert.deepEqual(actual, expected); },
    toBeNull() { assert.equal(actual, null); },
    toBeGreaterThan(expected) { assert.ok(actual > expected); },
    toBeLessThan(expected) { assert.ok(actual < expected); },
  };
}
import { MinHeap } from '../algorithms/minHeap.js';

describe('MinHeap Priority Queue', () => {
  it('extracts elements in ascending priority order', () => {
    const heap = new MinHeap();
    heap.push('C', 15);
    heap.push('A', 5);
    heap.push('B', 10);
    heap.push('D', 20);

    expect(heap.pop()).toEqual({ id: 'A', priority: 5, data: null });
    expect(heap.pop()).toEqual({ id: 'B', priority: 10, data: null });
    expect(heap.pop()).toEqual({ id: 'C', priority: 15, data: null });
    expect(heap.pop()).toEqual({ id: 'D', priority: 20, data: null });
    expect(heap.pop()).toBeNull();
  });

  it('correctly peeks at the minimum without removing', () => {
    const heap = new MinHeap();
    heap.push('X', 40);
    heap.push('Y', 8);

    expect(heap.peek()?.id).toBe('Y');
    expect(heap.size).toBe(2);
  });

  it('supports decreaseKey to update priority when a cheaper path is found', () => {
    const heap = new MinHeap();
    heap.push('Node1', 50);
    heap.push('Node2', 80);

    // decreaseKey via push or direct call
    heap.push('Node2', 20); // Should decrease key

    expect(heap.pop()?.id).toBe('Node2');
    expect(heap.pop()?.id).toBe('Node1');
  });

  it('handles empty heap cleanly', () => {
    const heap = new MinHeap();
    expect(heap.isEmpty()).toBe(true);
    expect(heap.pop()).toBeNull();
    expect(heap.peek()).toBeNull();
  });
});
