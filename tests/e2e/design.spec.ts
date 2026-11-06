import { test, expect } from "@playwright/test";

const ROUTES = ["/", "/company", "/capital", "/operating", "/returns", "/pricing", "/diligence", "/evidence", "/documents"];
const settle = async (page: import("@playwright/test").Page, url: string) => { await page.goto(url); await page.waitForLoadState("networkidle"); };

test.describe("landing narrative", () => {
  test("hero CTAs reach working destinations", async ({ page }) => {
    await settle(page, "/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("The structure");
    await page.getByRole("link", { name: /Explore the Investment Case/ }).click();
    await expect(page).toHaveURL(/#opportunity$/);
    await expect(page.getByRole("heading", { name: /A real operator/ })).toBeVisible();
    await page.getByRole("link", { name: /Open the Underwriting Model/ }).click();
    await expect(page).toHaveURL(/\/operating$/);
  });

  test("six numbered sections in order, with the unchanged decision", async ({ page }) => {
    await settle(page, "/");
    const labels = await page.locator("header span.sr-only").allTextContents();
    expect(labels.map((l) => l.slice(0, 11))).toEqual(["Section 01:", "Section 02:", "Section 03:", "Section 04:", "Section 05:", "Section 06:"]);
    await expect(page.getByRole("heading", { level: 2, name: /DO NOT INVEST/ })).toBeVisible();
  });

  test("scenario switch shows exact engine values and keeps the verdict", async ({ page }) => {
    await settle(page, "/");
    const dl = page.locator("dl").filter({ hasText: "Gross investor IRR" }).first();
    await page.getByRole("radio", { name: "Downside" }).click();
    await expect(dl).toContainText("12.0%");
    await expect(dl).toContainText("1.12x");
    await expect(dl).toContainText("Below");
    await page.getByRole("radio", { name: "Upside" }).click();
    await expect(dl).toContainText("15.1%");
    await expect(dl).toContainText("1.51x");
    await expect(page.getByText("No scenario clears both the return target and the coverage test.")).toBeVisible();
  });

  test("tradeoff slider: IRR responds, downside coverage does not", async ({ page }) => {
    await settle(page, "/");
    const s = page.locator("#w-slider");
    await s.fill("10");
    await expect(page.getByText("16.5%").first()).toBeVisible();
    await expect(page.getByText(/downside case still posts a minimum coverage of 1\.12x/)).toBeVisible();
  });
});

test.describe("capital stack", () => {
  test("layers reflect sandbox edits and explain seniority", async ({ page }) => {
    await settle(page, "/capital");
    const sub = page.getByRole("button", { name: /^Subordinated debt, \$8.00m/ });
    await expect(sub).toBeVisible();
    await page.getByRole("textbox", { name: /^Subordinated debt/ }).fill("9");
    await expect(page.getByRole("button", { name: /^Subordinated debt, \$9.00m/ })).toBeVisible();
    await page.getByRole("button", { name: /^Preferred equity/ }).click();
    await expect(page.getByText(/3 · Preferred equity/)).toBeVisible();
    await expect(page.getByText(/PIK accrual/)).toBeVisible();
  });
});

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });
  test("content is present immediately and smooth scroll is off", async ({ page }) => {
    await settle(page, "/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.classList.contains("lenis"))).toBe(false);
    const dur = await page.evaluate(() => getComputedStyle(document.querySelector(".btn")!).transitionDuration);
    expect(parseFloat(dur)).toBeLessThan(0.01);
  });
});

test.describe("responsive widths: no horizontal overflow", () => {
  for (const w of [360, 390, 768, 1024, 1440, 1920]) {
    test(`all routes at ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      for (const r of ROUTES) {
        await settle(page, r);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over, `${r} @${w}`).toBeLessThanOrEqual(1);
      }
    });
  }
});
