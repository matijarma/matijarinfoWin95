export function createFocusManager({ baseZIndex = 30 } = {}) {
  const focusedIds = new Set();
  let topZIndex = baseZIndex;

  function claim(id) {
    focusedIds.add(id);
    topZIndex += 1;
    return topZIndex;
  }

  function release(id) {
    focusedIds.delete(id);
  }

  function reset() {
    focusedIds.clear();
    topZIndex = baseZIndex;
  }

  function isKnown(id) {
    return focusedIds.has(id);
  }

  function getTopZIndex() {
    return topZIndex;
  }

  return {
    claim,
    release,
    reset,
    isKnown,
    getTopZIndex,
  };
}
