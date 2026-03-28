import { createSymbianShell as createS60ThirdShell } from "../s60-3rd/index.js";

export function createSymbianShell(options = {}) {
  return createS60ThirdShell({
    ...options,
    variant: "s60-3rd",
  });
}
