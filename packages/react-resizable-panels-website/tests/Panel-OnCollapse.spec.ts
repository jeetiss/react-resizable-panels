import { expect, Page, test } from "@playwright/test";

import { PanelCollapseLogEntry } from "../src/routes/examples/types";

import { clearLogEntries, getLogEntries } from "./utils/debug";

async function verifyEntries(
  page: Page,
  expected: Omit<PanelCollapseLogEntry, "type">[]
) {
  const logEntries = await getLogEntries<PanelCollapseLogEntry>(
    page,
    "onCollapse"
  );

  expect(logEntries.length).toEqual(expected.length);

  for (let index = 0; index < expected.length; index++) {
    const { panelId: actualPanelId, collapsed: actualCollapsed } =
      logEntries[index];
    const { panelId: expectedPanelId, collapsed: expectedPanelCollapsed } =
      expected[index];

    expect(actualPanelId).toEqual(expectedPanelId);
    expect(actualCollapsed).toEqual(expectedPanelCollapsed);
  }
}

test.describe("Panel onCollapse prop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:2345/examples/imperative-api");
  });

  test("should be called once on-mount", async ({ page }) => {
    // No panels are collapsed by default.
    await verifyEntries(page, []);

    // If we override via URL parameters, we should be notified though.
    await page.goto("http://localhost:2345/examples/imperative-api?collapse");
    await verifyEntries(page, [
      { panelId: "left", collapsed: true },
      { panelId: "right", collapsed: true },
    ]);
  });

  test("should be called when panels are resized", async ({ page }) => {
    const resizeHandles = page.locator("[data-panel-resize-handle-id]");
    const first = resizeHandles.first();
    const last = resizeHandles.last();

    await clearLogEntries(page);

    // Resizing should not trigger onCollapse unless the panel's collapsed state changes.
    await first.focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Shift+ArrowLeft");
    await verifyEntries(page, []);

    await page.keyboard.press("Home");
    await verifyEntries(page, [{ panelId: "left", collapsed: true }]);

    await clearLogEntries(page);

    await last.focus();
    await page.keyboard.press("End");
    await verifyEntries(page, [{ panelId: "right", collapsed: true }]);

    await clearLogEntries(page);

    // Resizing should not trigger onCollapse unless the panel's collapsed state changes.
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("End");
    await verifyEntries(page, []);

    await page.keyboard.press("ArrowLeft");
    await verifyEntries(page, [{ panelId: "right", collapsed: false }]);
  });
});
