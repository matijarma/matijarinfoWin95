import { createSymbianShell as createS60Shell } from "../mobile-variants/s60-3rd/index.js";

export function createSymbianShell({ root, variant = "s60-3rd" } = {}) {
  void variant;

  return createS60Shell({
    root,
    variant: "s60-3rd",
  });
}
