import { createSymbianShell } from "./mobile-symbian/index.js";

export function mountMobileRuntime(root) {
  const shell = createSymbianShell({ root });
  shell.mount();

  return () => {
    shell.unmount();
  };
}
