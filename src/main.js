import { isProbablyMobile } from "./core/utils/input.js";
import { mountDesktopRuntime } from "./entry-desktop.js";
import { mountMobileRuntime } from "./entry-mobile.js";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app mount node.");
}

if (isProbablyMobile()) {
  mountMobileRuntime(root);
} else {
  mountDesktopRuntime(root);
}
