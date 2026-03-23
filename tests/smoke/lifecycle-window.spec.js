import { expect, test } from "@playwright/test";

async function bootToDesktop(page) {
  await page.goto("/");
  await expect(page.locator(".bios95-screen")).toBeVisible();
  await expect(page.locator("[data-bios-error]")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("[data-bios-prompt]")).toBeVisible({ timeout: 5000 });
  await page.keyboard.press("F1");
  await expect(page.getByTestId("desktop-shell")).toBeVisible({ timeout: 9000 });
}

test("lifecycle, launch, taskbar, and shutdown flow", async ({ page }) => {
  await bootToDesktop(page);

  const myComputerIcon = page
    .locator('[data-desktop-icons] .win-icon', { hasText: "My Computer" })
    .first();
  await myComputerIcon.dblclick();

  const myComputerWindow = page.locator('.os-window[data-app-id="my-computer"]');
  await expect(myComputerWindow).toBeVisible();

  const taskbarButton = page
    .locator(".taskbar__window", { hasText: "My Computer" })
    .first();
  await expect(taskbarButton).toBeVisible();

  await myComputerWindow.locator(".os-window__control").first().click();
  await expect(myComputerWindow).toBeHidden();

  await taskbarButton.click();
  await expect(myComputerWindow).toBeVisible();

  await page.keyboard.down("Alt");
  await page.keyboard.press("F4");
  await page.keyboard.up("Alt");
  await expect(page.locator('.os-window[data-app-id="my-computer"]')).toHaveCount(0);

  await page.getByTestId("start-button").click();
  await page
    .locator(".start-menu:not(.is-hidden) .win95-menu__button", {
      hasText: "Shut Down...",
    })
    .click();

  await expect(page.locator(".safeoff95-screen__message")).toContainText(
    "It is now safe to turn off your computer.",
    { timeout: 10000 },
  );
});

test("marquee selection, folder selection, shortcuts, and window constraints", async ({
  page,
}) => {
  await bootToDesktop(page);

  const recycleBinIcon = page
    .locator('[data-desktop-icons] .win-icon', { hasText: "Recycle Bin" })
    .first();
  await recycleBinIcon.click({ button: "right" });
  await page
    .locator(".context-menu .context-menu__button", { hasText: "Open" })
    .first()
    .click();
  const recycleBinWindow = page.locator('.os-window[data-app-id="recycle-bin"]');
  await expect(recycleBinWindow).toBeVisible();
  await recycleBinWindow.locator(".os-window__control--close").click();
  await expect(recycleBinWindow).toHaveCount(0);

  const desktopSurface = page.locator('[data-desktop-icons] .icon-surface').first();
  const surfaceBox = await desktopSurface.boundingBox();

  if (!surfaceBox) {
    throw new Error("Missing desktop surface bounding box.");
  }

  await page.mouse.move(surfaceBox.x + 260, surfaceBox.y + 18);
  await page.mouse.down();
  await page.mouse.move(surfaceBox.x + 20, surfaceBox.y + 190);
  await page.mouse.up();

  await expect(page.locator('[data-desktop-icons] .win-icon.is-selected').first()).toBeVisible();

  await page
    .locator('[data-desktop-icons] .win-icon', { hasText: "My Computer" })
    .first()
    .dblclick();
  await expect(page.locator('.os-window[data-app-id="my-computer"]')).toBeVisible();

  await page
    .locator('[data-desktop-icons] .win-icon', { hasText: "Internet Explorer" })
    .first()
    .dblclick();
  await expect(page.locator('.os-window[data-app-id="internet-explorer"]')).toBeVisible();

  const activeBeforeAltTab = await page
    .locator(".os-window.is-focused")
    .first()
    .getAttribute("data-window-id");

  await page.keyboard.down("Alt");
  await page.keyboard.press("Tab");
  await page.keyboard.up("Alt");

  const activeAfterAltTab = await page
    .locator(".os-window.is-focused")
    .first()
    .getAttribute("data-window-id");

  expect(activeAfterAltTab).not.toBe(activeBeforeAltTab);

  const myComputerWindow = page.locator('.os-window[data-app-id="my-computer"]');
  await myComputerWindow.locator(".os-window__titlebar").click();

  const maximizeButton = myComputerWindow.locator(".os-window__control--maximize");
  await maximizeButton.click();
  await expect(myComputerWindow).toHaveClass(/is-maximized/);
  await maximizeButton.click();
  await expect(myComputerWindow).not.toHaveClass(/is-maximized/);

  const folderSurface = myComputerWindow.locator(".icon-surface.icon-surface--folder").first();
  const folderBox = await folderSurface.boundingBox();

  if (!folderBox) {
    throw new Error("Missing folder surface bounding box.");
  }

  await page.mouse.move(folderBox.x + folderBox.width - 14, folderBox.y + 14);
  await page.mouse.down();
  await page.mouse.move(folderBox.x + 18, folderBox.y + 170);
  await page.mouse.up();

  await expect(myComputerWindow.locator(".win-icon.is-selected").first()).toBeVisible();

  const titleBar = myComputerWindow.locator(".os-window__titlebar");
  const titleBarBox = await titleBar.boundingBox();

  if (!titleBarBox) {
    throw new Error("Missing title bar bounds.");
  }

  await page.mouse.move(titleBarBox.x + titleBarBox.width / 2, titleBarBox.y + 8);
  await page.mouse.down();
  await page.mouse.move(titleBarBox.x - 500, titleBarBox.y - 300);
  await page.mouse.up();

  const clampedPosition = await myComputerWindow.evaluate((node) => ({
    left: Number.parseFloat(node.style.left || "0"),
    top: Number.parseFloat(node.style.top || "0"),
  }));

  expect(clampedPosition.left).toBeGreaterThanOrEqual(0);
  expect(clampedPosition.top).toBeGreaterThanOrEqual(0);

  const resizeHandle = myComputerWindow.locator(".os-window__resize-handle");
  await expect(resizeHandle).toBeVisible();

  const sizeBefore = await myComputerWindow.evaluate((node) => ({
    width: node.offsetWidth,
    height: node.offsetHeight,
  }));

  const resizeBox = await resizeHandle.boundingBox();

  if (!resizeBox) {
    throw new Error("Missing resize handle bounds.");
  }

  await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + resizeBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(resizeBox.x - 80, resizeBox.y - 80);
  await page.mouse.up();

  const sizeAfter = await myComputerWindow.evaluate((node) => ({
    width: node.offsetWidth,
    height: node.offsetHeight,
  }));

  expect(sizeAfter.width !== sizeBefore.width || sizeAfter.height !== sizeBefore.height).toBeTruthy();

  const ieTaskbarButton = page
    .locator(".taskbar__window", { hasText: "Internet Explorer" })
    .first();
  await ieTaskbarButton.click({ button: "right" });
  await page
    .locator(".context-menu .context-menu__button", { hasText: "Close" })
    .first()
    .click();
  await expect(page.locator('.os-window[data-app-id="internet-explorer"]')).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(page.locator(".start-menu")).toHaveClass(/is-hidden/);
});

test("icon position persistence and mnemonic shortcuts", async ({ page }) => {
  await bootToDesktop(page);

  const myComputerIcon = page
    .locator('[data-desktop-icons] .win-icon[data-icon-id="desktop-my-computer"]')
    .first();
  const iconBox = await myComputerIcon.boundingBox();

  if (!iconBox) {
    throw new Error("Missing desktop icon bounds.");
  }

  await page.mouse.move(iconBox.x + iconBox.width / 2, iconBox.y + 16);
  await page.mouse.down();
  await page.mouse.move(iconBox.x + iconBox.width / 2 + 160, iconBox.y + 110);
  await page.mouse.up();

  const movedPosition = await myComputerIcon.evaluate((node) => ({
    left: Number.parseFloat(node.style.left || "0"),
    top: Number.parseFloat(node.style.top || "0"),
  }));

  await page.getByTestId("start-button").click();
  await page.keyboard.press("r");
  await expect(page.locator('.os-window[data-app-id="run-dialog"]')).toBeVisible();
  await page.locator('.os-window[data-app-id="run-dialog"] .os-window__control--close').click();
  await expect(page.locator('.os-window[data-app-id="run-dialog"]')).toHaveCount(0);

  await myComputerIcon.dblclick();
  const myComputerWindow = page.locator('.os-window[data-app-id="my-computer"]');
  await expect(myComputerWindow).toBeVisible();
  await myComputerWindow.locator(".os-window__titlebar").click();

  await page.keyboard.down("Alt");
  await page.keyboard.press("v");
  await page.keyboard.up("Alt");
  await expect(page.locator(".context-menu .context-menu__button", { hasText: "Refresh" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.reload();
  await expect(page.locator(".bios95-screen")).toBeVisible();
  await expect(page.locator("[data-bios-prompt]")).toBeVisible({ timeout: 5000 });
  await page.keyboard.press("F1");
  await expect(page.getByTestId("desktop-shell")).toBeVisible({ timeout: 9000 });

  const persistedPosition = await page
    .locator('[data-desktop-icons] .win-icon[data-icon-id="desktop-my-computer"]')
    .first()
    .evaluate((node) => ({
      left: Number.parseFloat(node.style.left || "0"),
      top: Number.parseFloat(node.style.top || "0"),
    }));

  expect(persistedPosition.left).toBe(movedPosition.left);
  expect(persistedPosition.top).toBe(movedPosition.top);
});
