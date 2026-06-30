# PRD: PHX Home Loan Monorepo Migration

## Summary

Migrate the current PHX Home Loan website from two separate projects into one fresh Turborepo monorepo based on `robotostudio/turbo-start-sanity`.

Current projects:

- `phx-studio2/`: Sanity Studio v2, project `e4y15utr`, dataset `production`
- `phx-web-gatsby3/`: Gatsby 3, React 17, Theme UI, Sanity-sourced marketing site for `phxhomeloan.com`

Target project:

- Fresh repo initialized from a pinned commit of `https://github.com/robotostudio/turbo-start-sanity`
- `apps/web`: Next.js frontend from the starter
- `apps/studio`: Sanity Studio v5 from the starter
- Shared Turborepo workspace packages from the starter where useful
- Production web hosting on Vercel
- Hosted Sanity Studio deployed with `sanity deploy`

## Primary goal

Launch the new monorepo-backed site with SEO/content parity against the current Gatsby site, while moving the content model toward the starter’s Sanity v5 page-builder architecture.

SEO/content parity wins over starter purity, redesign, or implementation speed.

## Non-goals

- No product redesign.
- No broad copy rewrite.
- No new CRM/form system.
- No new review/testimonial system beyond preserving the current EmbedSocial reviews embed.
- No new loan-program content model during this migration.
- No analytics strategy change beyond carrying forward GTM.
- No need to port old `AGENTS.md` or old agent docs. The domain `CONTEXT.md` will be copied manually outside this plan.

## Target architecture

### Repository

- Start from a pinned `turbo-start-sanity` commit.
- Use strict TypeScript everywhere for new code.
- Use the starter’s Turborepo conventions.
- Root scripts should delegate to `turbo run`.
- Package-level scripts should live in each package.

### Sanity

- Reuse Sanity project `e4y15utr`.
- Create a new dataset named `production-v2`.
- `production-v2` becomes the live dataset after cutover.
- Keep the old `production` dataset available as rollback/archive during migration.
- Deploy a Sanity-hosted Studio configured for `production-v2`.
- Keep the starter’s Presentation / Visual Editing approach and wire it for core routes.

### Web

- Deploy the Next.js app to Vercel.
- Keep the starter’s Sanity/Next caching and live-preview approach unless a concrete bug requires changing it.
- Preserve current public URLs and SEO behavior.

## Content model requirements

Use the starter schema as the base, then add PHX-specific extensions where needed.

### Starter-aligned documents

Use starter-style documents for:

- `homePage`
- `navbar`
- `footer`
- `settings`
- `page`
- `blog`
- `blogIndex`
- `faq`
- `redirect`
- `author`

### PHX extensions

Add PHX-specific schema extensions for:

- `category`: routed blog categories at root paths like `/buyer-education/`
- `teamMember`: migrated from old `person` docs
- Custom rich text members/marks needed by current content
- EmbedSocial reviews block
- Dynamic latest-posts block
- Team-members block
- PHX homepage blocks where starter generic blocks are not enough
- Structured contact pathways
- Structured compliance/footer fields
- Sidebar/contact CTA settings
- Custom PHX icons for feature cards

### Legacy type mapping

After importing the old dataset into `production-v2`, transform content as follows:

| Old type | New type / treatment |
| --- | --- |
| `post` | Create new `blog` docs |
| `page` | Transform in place to starter-style `page` docs where practical |
| `category` | Transform in place to PHX `category` docs |
| `person` | Create new `teamMember` docs |
| `author` | Transform in place where compatible |
| `redirects` singleton | Create individual starter-style `redirect` docs |
| `siteSettings` | Map into starter `settings` and related structured settings |
| `reviewsWidget` | Do not migrate as legacy data; current dataset has no rendered reviews widget content. Use an EmbedSocial page-builder block instead. |

Legacy documents may remain temporarily in `production-v2` for traceability, hidden from Studio navigation and web queries. Delete later after migration sign-off.

## Content migration requirements

### Dataset seeding

- Export old Sanity `production` with assets.
- Import that export into `production-v2` first.
- Then run transformation scripts inside `production-v2`.
- This preserves Sanity asset documents and old references before transformation.

### Migration scripts

Migration scripts should be deterministic and idempotent.

They should:

- Preserve source IDs or source metadata where useful for debugging.
- Use stable IDs for generated docs.
- Create/update migrated docs safely on rerun.
- Import or transform referenced documents before documents that reference them.
- Produce a migration report with counts, skipped content, warnings, and copy/content issues.
- Support repeated sync from old `production` during development.
- Support a short content freeze before final sync.

### Published content only

Migrate published content only. Do not migrate old drafts unless this requirement changes later.

## Routing and SEO requirements

URL and SEO parity are launch blockers.

### URL policy

- Preserve trailing slash canonicals.
- Redirect no-slash variants to slash variants where needed.
- Blog posts must stay at root paths: `/{slug}/`.
- New blog posts after launch should also use root paths.
- Generic pages stay at root paths: `/{slug}/`.
- Category listing pages stay at root paths: `/{categorySlug}/`.
- Blog index stays at `/blog/`.
- Blog pagination stays at `/blog/2/`, `/blog/3/`, etc.
- Category pagination stays at `/{categorySlug}/2/`, etc.

### Slug uniqueness

Because pages, blog posts, and categories all live at root paths, the Studio and/or validation scripts must enforce cross-type slug uniqueness across routed content.

### Redirects and gone routes

- Migrate old Sanity redirects from the `redirects` singleton into individual starter-style `redirect` documents.
- Keep 301/302 behavior.
- Keep current hardcoded 410 Gone routes in code/config, not in Sanity.
- A future enhancement may move 410 management into Sanity, but not this migration.

### Metadata and structured data

- Preserve metadata behavior: titles, descriptions, canonical URLs, Open Graph, Twitter metadata, noindex.
- Preserve sitemap behavior, including noindex/hide-from-sitemap handling.
- Rebuild JSON-LD from structured settings/team/content fields.
- Preserve current structured-data intent, but fix stale technical data such as old Netlify URLs or unrelated copied domains.

### Analytics

- Carry forward GTM `GTM-WZCLNW8`.
- Do not carry forward old Universal Analytics unless a separate verified reason appears.

## Page and content rendering requirements

### Existing generic pages

Existing Sanity `page` documents should migrate into the starter page-builder model as one `richTextBlock` by default.

Example:

- Old `/phoenix-va-loan/` page body becomes `page.pageBuilder = [{ _type: "richTextBlock", richText: oldBody }]`.
- The page still renders at `/phoenix-va-loan/`.
- The page keeps title, metadata, rich text, links, images, and sidebar behavior.

Do not manually decompose all legacy pages into hero/CTA/card blocks during this migration.

### Homepage

The homepage should be Sanity-managed through `homePage` and PHX/starter page-builder blocks.

It must preserve the current homepage’s main sections and behavior:

- Hero
- Loan feature cards using current custom PHX icons
- Meet Jimmy / video section
- EmbedSocial reviews section
- Dynamic latest posts section
- FAQ section
- CTA / award section

### Blog posts

Blog posts should migrate from old `post` docs into starter-style `blog` docs with PHX routing changes.

Requirements:

- Preserve root post URLs.
- Preserve published date.
- Preserve main image and alt text where present.
- Preserve categories.
- Preserve excerpt/body rich text.
- Preserve custom Portable Text marks and embedded types needed by current content.
- Preserve SEO fields and noindex.

### Blog and category listings

Use structured listing pages:

- `blogIndex` singleton for `/blog/`
- `category` docs for category listing routes

Listings should render dynamic post lists and preserve pagination behavior.

### Nav and footer

Main navigation and footer should become Sanity-managed singletons.

- Seed nav from current hardcoded `gatsby-config.js` navigation.
- Seed footer from current hardcoded footer content.
- Model compliance footer content as structured required fields, not loose rich text only.

### Team page

`/our-team/` should become a normal `page` document with a PHX team-members page-builder block referencing `teamMember` docs.

### Sidebar/contact CTA

Preserve the current right-sidebar CTA pattern for migrated legacy pages and blog posts.

Model contact pathways and sidebar CTA settings in Sanity where practical.

## Rich text requirements

Extend starter `richText` so migrated content does not lose structure.

Current content needs support for:

- Normal blocks and headings
- Bullet and numbered lists
- Internal links to migrated pages/posts
- External links
- Button marks
- Images
- Tables
- YouTube embeds if present
- Iframe embeds if present

Unsupported or suspicious content should be reported, not silently dropped.

## Asset requirements

- Content images, page images, awards, PDFs, and reusable content assets should live in Sanity where they are editor-managed.
- Favicons, app-shell logos, and custom PHX icon assets may stay in the repo.
- Do not leave migrated production content dependent on old Gatsby image processing.
- Do not lose alt text where it exists.

## Studio requirements

Use a PHX-specific Studio structure that preserves the old editor mental model while exposing starter concepts.

Required Studio areas:

- Home Page
- Navigation
- Footer
- Settings
- Pages
- Blog
- Categories
- Team Members
- FAQs
- Redirects

Presentation / Visual Editing should work for core routes:

- Home
- Pages
- Blog posts
- Category listing pages
- Draft preview where supported by the starter

## UI requirements

- Rewrite the frontend in strict TypeScript and Tailwind/starter component patterns.
- Do not carry Theme UI into the new app.
- Target brand/layout parity, not pixel-perfect cloning.
- Preserve PHX visual identity, content hierarchy, key CTAs, and major layouts.
- Allow small responsive/accessibility improvements if they do not change the product/design scope.

## Copy/content policy

- Preserve editorial copy as-is during migration.
- Fix technical/stale URL/schema/compliance issues.
- Produce a copy/content issues report for later editorial cleanup.
- Do not rewrite marketing copy as part of this migration.

Examples of issues to report rather than rewrite broadly:

- Stale old-domain references
- Old Netlify URLs in structured data
- Obvious copied-domain mistakes
- Typos found in hardcoded homepage copy or Sanity body text

## Deployment requirements

- Vercel deploys `apps/web` from Git.
- Sanity Studio deploys from Git using the starter-style `sanity deploy` workflow.
- Verify on a temporary Vercel URL before pointing `phxhomeloan.com` to Vercel.
- Keep old Netlify/Gatsby site available for rollback during the launch window.

## Acceptance criteria

The migration is ready to cut over when all of these pass:

- New monorepo builds successfully.
- Sanity Studio builds/deploys successfully.
- `production-v2` contains the migrated/required content.
- Published source counts match expected migrated counts.
- Core references resolve: authors, categories, team members, internal links, assets.
- All current public routes are accounted for as pages, posts, categories, redirects, or 410 gone routes.
- Root blog post URLs work.
- Category listing URLs work.
- Blog and category pagination works.
- Trailing-slash canonical policy works.
- Sitemap excludes noindex/hidden content.
- Redirects preserve 301/302 behavior.
- Hardcoded 410 routes preserve Gone behavior.
- Metadata and structured data render without stale old-domain mistakes.
- GTM is present.
- Representative visual checks pass for homepage, generic page, blog post, blog index, category page, team page, and footer.
- Rich text content renders without dropped tables/images/buttons/links.
- Migration report has no unresolved launch-blocking issues.

## Best implementation shape: vertical tracer bullets

Use one long-lived migration branch/repo build, but implement it as vertical tracer-bullet slices instead of horizontal layers.

Do not build “all schema”, then “all migration”, then “all UI”. Each slice should prove a narrow path end-to-end through schema, content, route, UI, SEO, and validation.

Recommended slices:

1. **Foundation slice**
   - Starter boots.
   - `production-v2` connected.
   - Studio and web read the same dataset.
   - One dummy or real Sanity route renders.

2. **Hard content slice**
   - Migrate one complex blog post end-to-end.
   - Use a post with table/image/button/internal/external links, such as `how-much-are-closing-costs-on-a-house`.
   - Proves rich text, assets, root post URLs, and SEO.

3. **Generic page slice**
   - Migrate one old `page` into `pageBuilder: [richTextBlock]`.
   - Proves trailing slash, sidebar, metadata, and old page layout.

4. **Listing slice**
   - Implement blog index plus one category page with pagination.
   - Proves root category URLs and post/category references.

5. **Homepage slice**
   - Build the `homePage` document with PHX blocks.
   - Proves page builder, custom blocks, latest posts, and reviews embed.

6. **Chrome/settings slice**
   - Implement nav, footer, contact pathways, compliance fields, GTM, and structured data.

7. **Full migration and parity gates**
   - Run the bulk transform.
   - Validate route inventory.
   - Validate redirects and 410s.
   - Validate sitemap/noindex/metadata.
   - Run representative visual checks.

Key constraint: vertical slices should harden reusable patterns. Do not hack one route just to make a demo work if later slices will need to replace it.
