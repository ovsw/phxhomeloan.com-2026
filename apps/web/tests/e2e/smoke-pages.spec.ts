import { test, expect } from "./fixtures";

test.describe("Smoke: static routes", { tag: "@smoke" }, () => {
  test("home page loads", async ({ page }) => {
    const response = await page.goto("/");

    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("blog index loads", async ({ page }) => {
    const response = await page.goto("/blog");

    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

test.describe("Smoke: dynamic slug pages", { tag: "@smoke" }, () => {
  test("one CMS page renders with Visual Editing metadata", async ({
    page,
    slugPages,
    baseURL,
  }) => {
    const proofPage = slugPages.proofPage;

    expect(
      proofPage,
      "Expected at least one Sanity page with page-builder content"
    ).toBeTruthy();

    if (!proofPage) {
      throw new Error("Missing Sanity page with page-builder content");
    }

    const response = await page.goto(`${baseURL}${proofPage}`);

    expect(response?.status()).toBe(200);

    const pageBuilder = page.locator("main[data-sanity]").first();
    await expect(pageBuilder).toBeVisible();
    await expect(pageBuilder).toHaveAttribute("data-sanity", /.+/);
    await expect(pageBuilder.locator("[data-sanity]").first()).toBeVisible();
  });

  test("draft preview enables the Presentation preview UI", async ({
    page,
    slugPages,
    baseURL,
  }) => {
    const previewSecret = process.env.SANITY_E2E_PREVIEW_SECRET;
    const proofPage = slugPages.proofPage;

    if (!previewSecret) {
      test.skip(
        true,
        "Set SANITY_E2E_PREVIEW_SECRET to a valid Sanity preview URL secret"
      );
      return;
    }

    expect(
      proofPage,
      "Expected at least one Sanity page with page-builder content"
    ).toBeTruthy();

    if (!proofPage) {
      throw new Error("Missing Sanity page with page-builder content");
    }

    const draftUrl = new URL("/api/presentation-draft", baseURL);
    draftUrl.searchParams.set("sanity-preview-secret", previewSecret);
    draftUrl.searchParams.set("sanity-preview-pathname", proofPage);
    draftUrl.searchParams.set("sanity-preview-perspective", "drafts");

    await page.goto(draftUrl.toString());

    expect(new URL(page.url()).pathname).toBe(proofPage);
    await expect(
      page.getByText("Viewing the website in preview mode.")
    ).toBeVisible();
    await expect(page.locator("main[data-sanity]").first()).toBeVisible();
  });

  test("all CMS pages load without errors", async ({
    page,
    slugPages,
    baseURL,
  }) => {
    test.setTimeout(5 * 60_000);

    const allSlugs = [...slugPages.pages, ...slugPages.blogs];

    expect(allSlugs.length).toBeGreaterThan(0);

    const failures: { slug: string; reason: string }[] = [];

    for (const slug of allSlugs) {
      const url = `${baseURL}${slug}`;
      const response = await page.goto(url);
      const status = response?.status() ?? 0;

      if (status !== 200) {
        failures.push({ slug, reason: `status ${status}` });
        continue;
      }

      const title = await page.title();
      if (/404|not found/i.test(title)) {
        failures.push({ slug, reason: "page shows 404" });
        continue;
      }

      const hasContent = await page.evaluate(
        () => document.body.innerText.trim().length > 0,
      );
      if (!hasContent) {
        failures.push({ slug, reason: "page has no visible content" });
      }
    }

    if (failures.length > 0) {
      const report = failures
        .map((f) => `  ${f.slug}: ${f.reason}`)
        .join("\n");
      throw new Error(`${failures.length} page(s) failed:\n${report}`);
    }
  });

  test("migrated closing-costs article renders root content and metadata", async ({
    page,
    slugPages,
    baseURL,
  }) => {
    const tracerBlog = slugPages.tracerBlog;

    expect(
      tracerBlog,
      "Expected the closing-costs tracer blog migration to exist"
    ).toBeTruthy();

    if (!tracerBlog) {
      throw new Error("Missing closing-costs tracer blog");
    }

    const response = await page.goto(`${baseURL}${tracerBlog.slug}/`);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "How Much are Closing Costs"
    );
    await expect(
      page.getByRole("link", { name: "Get Personalized Closing Costs" })
    ).toBeVisible();
    await expect(page.getByRole("table").first()).toBeVisible();
    await expect(page.locator("img").first()).toHaveAttribute(
      "alt",
      /closing costs/i
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/how-much-are-closing-costs-on-a-house\/$/
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      tracerBlog.seoDescription ?? /closing cost/i
    );
  });
});
