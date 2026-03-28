import { createSymbianShell as createS60Shell } from "../mobile-variants/v1995-s60/index.js";

export function createSymbianShell({ root } = {}) {
  return createS60Shell({
    root,
    variant: "uiq-p1i",
  });
}
