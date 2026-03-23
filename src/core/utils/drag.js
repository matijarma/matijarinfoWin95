export function makeDraggable({
  handle,
  target,
  shouldStart,
  constrainPosition,
  onMoveStart,
  onMove,
  onMoveEnd,
}) {
  if (!handle || !target) {
    throw new Error("makeDraggable requires both handle and target elements.");
  }

  let pointerId = null;
  let startPointerX = 0;
  let startPointerY = 0;
  let startLeft = 0;
  let startTop = 0;

  function onPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (typeof shouldStart === "function" && !shouldStart(event)) {
      return;
    }

    pointerId = event.pointerId;
    startPointerX = event.clientX;
    startPointerY = event.clientY;
    startLeft = target.offsetLeft;
    startTop = target.offsetTop;

    handle.setPointerCapture(pointerId);

    onMoveStart?.({ left: startLeft, top: startTop });

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onPointerMove(event) {
    if (event.pointerId !== pointerId) {
      return;
    }

    const deltaX = event.clientX - startPointerX;
    const deltaY = event.clientY - startPointerY;
    let nextLeft = startLeft + deltaX;
    let nextTop = startTop + deltaY;

    if (typeof constrainPosition === "function") {
      const constrained = constrainPosition({
        left: nextLeft,
        top: nextTop,
        deltaX,
        deltaY,
        startLeft,
        startTop,
      });

      if (constrained && typeof constrained === "object") {
        if (typeof constrained.left === "number") {
          nextLeft = constrained.left;
        }

        if (typeof constrained.top === "number") {
          nextTop = constrained.top;
        }
      }
    }

    target.style.left = `${nextLeft}px`;
    target.style.top = `${nextTop}px`;

    onMove?.({ left: nextLeft, top: nextTop });
  }

  function onPointerUp(event) {
    if (event.pointerId !== pointerId) {
      return;
    }

    try {
      handle.releasePointerCapture(pointerId);
    } catch {
      // Ignore if capture already released.
    }

    pointerId = null;

    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);

    onMoveEnd?.({
      left: target.offsetLeft,
      top: target.offsetTop,
    });
  }

  handle.addEventListener("pointerdown", onPointerDown);

  return () => {
    handle.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };
}
