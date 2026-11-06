import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const PAGES = [
  ["/", "DO NOT INVEST AS PRICED"], ["/company", "what the evidence supports"], ["/capital", "claim by claim"],
  ["/operating", "Five-year operating projections"], ["/returns", "Investor cash flows"], ["/pricing", "Pricing lab"],
  ["/diligence", "Research-backed risk register"], ["/evidence", "Public source register"], ["/documents", "Document library"],
] as const;

const open = async (page: Page, url: string) => { await page.goto(url); await page.waitForLoadState("networkidle"); };

test.describe("navigation and disclosure", () => {
  for (const [url, text] of PAGES) {
    test(`renders ${url} with disclosure banner`, async ({ page }) => {
      await open(page, url);
      await expect(page.locator("main").getByText(text).first()).toBeVisible();
      await expect(page.getByRole("note", { name: "Disclosure" })).toContainText("Not affiliated with, endorsed by, or connected to Seacoast Capital or National Fleet Services");
    });
  }

  test("primary nav reaches every module", async ({ page, isMobile }) => {
    await open(page, "/");
    for (const [url] of PAGES.slice(1)) {
      if (isMobile) await page.locator('button[aria-controls="nav-list"]').click();
      await page.locator(`nav[aria-label="Primary"] a[href="${url}"]`).click();
      await expect(page).toHaveURL(url);
    }
  });
});

test.describe("executive screen reference values", () => {
  test("shows engine-calculated scenario outputs matching the reference package", async ({ page }) => {
    await open(page, "/");
    const t = page.getByRole("table", { name: /Scenario comparison/ });
    await expect(t).toContainText("13.8%");
    await expect(t).toContainText("12.0%");
    await expect(t).toContainText("15.1%");
    await expect(page.getByText("3.13x").first()).toBeVisible();
    await expect(page.getByText("10.0%").first()).toBeVisible();
    await expect(page.getByText("only to the illustrative structure").first()).toBeVisible();
    await expect(page.getByText("analyst assumption", { exact: false }).first()).toBeVisible();
  });
});

test.describe("sandbox scenario editing (integration)", () => {
  test("editing a driver recalculates, shows validation, and resets; sandbox persists across pages", async ({ page }) => {
    await open(page, "/capital");
    const warrant = page.getByLabel(/^Warrant participation/);
    await warrant.fill("10");
    await open(page, "/capital"); // hard reload resets (in-memory sandbox by design)
    await expect(warrant).toHaveValue("5");

    // client-side navigation keeps sandbox state
    await warrant.fill("10");
    if (page.viewportSize()!.width < 1280) await page.locator('button[aria-controls="nav-list"]').click();
    await page.locator('nav[aria-label="Primary"] a[href="/returns"]').click();
    await expect(page.getByRole("status").filter({ hasText: "SANDBOX: edited assumptions" })).toBeVisible();
    await expect(page.getByText("16.5%").first()).toBeVisible(); // 10% warrant -> 16.5% (workbook sensitivity row)

    // invalid input -> message and last valid results retained
    if (page.viewportSize()!.width < 1280) await page.locator('button[aria-controls="nav-list"]').click();
    await page.locator('nav[aria-label="Primary"] a[href="/capital"]').click();
    await warrant.fill("150");
    await expect(page.getByRole("alert").filter({ hasText: "between 0% and 100%" })).toBeVisible();
    await expect(warrant).toHaveAttribute("aria-invalid", "true");
    await page.getByRole("textbox", { name: /^Subordinated debt/ }).fill("-1");
    await expect(page.getByRole("alert").filter({ hasText: "zero or greater" })).toBeVisible();

    await page.getByRole("button", { name: "Reset to baseline" }).click();
    await expect(warrant).toHaveValue("5");
    await expect(page.getByRole("status").filter({ hasText: "Sandbox: matches reference model" })).toBeVisible();
  });

  test("operating: changing downside margin updates coverage", async ({ page }) => {
    await open(page, "/operating");
    await page.getByRole("radio", { name: "Downside" }).click();
    const t = page.getByRole("table", { name: /Downside case projections/ });
    await expect(t).toContainText("1.12x");
    for (const y of [1, 2, 3, 4, 5]) await page.getByLabel(`Downside FY${y} EBITDA margin`).fill("20");
    await expect(t).not.toContainText("1.12x");
    await expect(page.getByText("Minimum fixed-charge coverage")).toBeVisible();
  });
});

test.describe("pricing lab", () => {
  test("starting structure fails hurdle; 10% warrant passes investor hurdle but downside coverage still fails", async ({ page }) => {
    await open(page, "/pricing");
    await expect(page.getByText("BELOW HURDLE").first()).toBeVisible();
    await expect(page.getByText("9.01%").first()).toBeVisible(); // required warrant (workbook formula)
    await page.getByLabel(/^Warrant participation/).fill("10");
    await expect(page.getByText("HURDLE PASS").first()).toBeVisible();
    await expect(page.getByText(/Investor-only improvement/)).toBeVisible();
    const all = page.getByRole("table", { name: "Scenario outcomes at lab terms" });
    await expect(all.getByRole("row", { name: /Downside/ })).toContainText("FAIL");
    await page.getByRole("button", { name: "Reset to reference case" }).click();
    await expect(page.getByText("BELOW HURDLE").first()).toBeVisible();
  });
  test("higher coupon helps investor but hurts credit", async ({ page }) => {
    await open(page, "/pricing");
    await page.getByLabel(/^Sub cash coupon/).fill("13");
    await expect(page.getByText(/Trade-off/)).toBeVisible();
  });
});

test.describe("diligence", () => {
  test("tracking never marks an item verified", async ({ page }) => {
    await open(page, "/diligence");
    await expect(page.getByTestId("risk-item")).toHaveCount(9);
    await expect(page.getByTestId("dd-row")).toHaveCount(18);
    await page.getByLabel("Demo tracking for Q01").selectOption("Demo: marked reviewed");
    await page.reload();
    await expect(page.getByLabel("Demo tracking for Q01")).toHaveValue("Demo: marked reviewed");
    const row = page.getByTestId("dd-row").first();
    await expect(row).toContainText("OPEN / NOT VERIFIED");
    await expect(page.getByText("VERIFIED", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "CRITICAL", exact: true }).click();
    await expect(page.getByTestId("dd-row")).toHaveCount(5);
  });
});

test.describe("evidence library", () => {
  test("lists all sources, filters, and has external links", async ({ page }) => {
    await open(page, "/evidence");
    await expect(page.getByTestId("source-row")).toHaveCount(13);
    await page.getByLabel("Search sources").fill("Sunbelt");
    await expect(page.getByTestId("source-row")).toHaveCount(1);
    await page.getByLabel("Search sources").fill("");
    await page.getByLabel("Entity").selectOption("Seacoast");
    await expect(page.getByTestId("source-row")).toHaveCount(5);
    await page.getByLabel("Entity").selectOption("All");
    const csv = fs.readFileSync(path.join(process.cwd(), "data/Seacoast_NFS_Public_Source_Register.csv"), "utf8");
    const urls = [...csv.matchAll(/https:\/\/[^,\s"]+/g)].map((m) => m[0]);
    expect(urls).toHaveLength(13);
    for (const u of urls) {
      const a = page.locator(`a[href="${u}"]`);
      await expect(a).toHaveAttribute("target", "_blank");
      await expect(a).toHaveAttribute("rel", /noopener/);
    }
  });
  test("deep link filters by source id; company profile source tags link to it", async ({ page }) => {
    await open(page, "/evidence?q=S06");
    await expect(page.getByTestId("source-row")).toHaveCount(1);
    await open(page, "/company");
    const tag = page.locator('a[href="/evidence?q=S06"]').first();
    await expect(tag).toBeVisible();
    await tag.click();
    await expect(page.getByTestId("source-row")).toHaveCount(1);
  });
  test("company profile labels every claim and flags unverified items", async ({ page }) => {
    await open(page, "/company");
    for (const l of ["VERIFIED PUBLIC FACT", "COMPANY SELF-REPORT", "ANALYST INTERPRETATION", "NOT VERIFIED"]) await expect(page.getByText(l, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("U-Haul").first()).toBeVisible();
  });
});

test.describe("downloads", () => {
  const FILES = [
    "Seacoast_NFS_Investment_Committee_Memo.pdf", "Seacoast_NFS_Executive_Investment_Brief.pdf",
    "Seacoast_NFS_Formula_Driven_Underwriting.xlsx", "Seacoast_NFS_Public_Source_Register.csv",
  ];
  const sha = (b: Buffer) => crypto.createHash("sha256").update(b).digest("hex");
  for (const f of FILES) {
    test(`download ${f} is byte-identical to the supplied original`, async ({ page }) => {
      await open(page, "/documents");
      const [dl] = await Promise.all([page.waitForEvent("download"), page.getByTestId(`dl-${f}`).click()]);
      expect(dl.suggestedFilename()).toBe(f);
      const saved = await dl.path();
      const original = fs.readFileSync(path.join(process.cwd(), "data", f));
      expect(sha(fs.readFileSync(saved))).toBe(sha(original));
      await expect(page.getByText(sha(original))).toBeVisible();
    });
  }
});

test.describe("mobile layout", () => {
  test("no horizontal page overflow on any page", async ({ page, isMobile }) => {
    test.skip(!isMobile);
    for (const [url] of PAGES) {
      await open(page, url);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over, url).toBeLessThanOrEqual(1);
    }
  });
  test("menu toggles and is keyboard operable", async ({ page, isMobile }) => {
    test.skip(!isMobile);
    await open(page, "/");
    const btn = page.locator('button[aria-controls="nav-list"]');
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await btn.focus();
    await page.keyboard.press("Enter");
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(`nav[aria-label="Primary"] a[href="/pricing"]`)).toBeVisible();
  });
});

test.describe("accessibility", () => {
  for (const [url] of PAGES) {
    test(`axe: no serious/critical violations on ${url}`, async ({ page }) => {
      await open(page, url);
      await page.waitForTimeout(1800); // let entrance animations settle
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    });
  }
  test("keyboard: skip link and tab order reach main content", async ({ page, isMobile }) => {
    test.skip(isMobile);
    await open(page, "/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  });
});
