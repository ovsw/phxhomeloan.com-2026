import { createClient, type SanityClient } from "@sanity/client";
import dotenv from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(scriptDir, "../.env"), quiet: true });
dotenv.config({
  path: resolve(scriptDir, "../../web/.env.local"),
  quiet: true,
});

const SOURCE_DATASET = "production";
const TARGET_DATASET = process.env.SANITY_STUDIO_DATASET ?? "production-v2";
const SOURCE_SLUG = "how-much-are-closing-costs-on-a-house";
const TARGET_SLUG = `/${SOURCE_SLUG}`;
const SOURCE_ID = "266da9e9-a853-41be-949d-c19b35b51cb6";
const DEFAULT_AUTHOR_NAME = "Jimmy Vercellino";
const API_VERSION = process.env.SANITY_STUDIO_API_VERSION ?? "2026-07-01";
const REPORT_PATH = resolve(
  scriptDir,
  "../migration-reports/closing-costs-tracer.json"
);

type Reference = {
  _ref: string;
  _type: "reference";
};

type LegacyImage = {
  _key?: string;
  _type: "mainImage";
  alt?: string | null;
  asset?: Reference;
};

type LegacyTable = {
  _key?: string;
  _type: "mytable";
  title?: string | null;
  generictable?: {
    rows?: Array<{
      _key?: string;
      cells?: string[];
    }>;
  };
};

type LegacyMarkDef = {
  _key: string;
  _type: "button" | "internalLink" | "link" | string;
  blank?: boolean;
  href?: string;
  reference?: Reference;
  referenceSlug?: string | null;
  referenceTitle?: string | null;
  referenceType?: string | null;
};

type LegacyBlock = {
  _key: string;
  _type: "block";
  children?: Array<{
    _key: string;
    _type: "span";
    marks?: string[];
    text?: string;
  }>;
  markDefs?: LegacyMarkDef[];
  style?: string;
  listItem?: string;
  level?: number;
};

type LegacyBodyItem = LegacyBlock | LegacyImage | LegacyTable;

type LegacyCategory = {
  _id: string;
  _type: "category";
  _updatedAt?: string;
  title?: string | null;
  slug?: { current?: string | null };
};

type LegacyPost = {
  _id: string;
  _type: "post";
  _updatedAt: string;
  title: string;
  slug?: { current?: string | null };
  excerpt?: LegacyBlock[] | null;
  body?: LegacyBodyItem[] | null;
  categories?: LegacyCategory[] | null;
  mainImage?: LegacyImage | null;
  publishedAt?: string | null;
  seoDescription?: string | null;
  seoNoIndex?: boolean | null;
  seoTitle?: string | null;
};

type TargetImage = {
  _type: "image";
  alt?: string | null;
  asset: Reference;
};

type BlogDocument = Record<string, unknown> & {
  _type: "blog";
};

type Report = {
  tracer: {
    sourceDataset: string;
    targetDataset: string;
    sourceId: string;
    sourceSlug: string;
    targetBlogId?: string;
    targetSlug: string;
  };
  counts: {
    assetsReused: number;
    assetsUploaded: number;
    authorsCreated: number;
    authorsUpdated: number;
    blogsCreated: number;
    blogsUpdated: number;
    buttonMarks: number;
    categoriesCreated: number;
    categoriesUpdated: number;
    externalLinks: number;
    imageBlocks: number;
    internalLinks: number;
    skippedContent: number;
    tables: number;
    textBlocks: number;
    warnings: number;
  };
  copyIssues: string[];
  skippedContent: string[];
  warnings: string[];
};

const report: Report = {
  tracer: {
    sourceDataset: SOURCE_DATASET,
    targetDataset: TARGET_DATASET,
    sourceId: SOURCE_ID,
    sourceSlug: SOURCE_SLUG,
    targetSlug: TARGET_SLUG,
  },
  counts: {
    assetsReused: 0,
    assetsUploaded: 0,
    authorsCreated: 0,
    authorsUpdated: 0,
    blogsCreated: 0,
    blogsUpdated: 0,
    buttonMarks: 0,
    categoriesCreated: 0,
    categoriesUpdated: 0,
    externalLinks: 0,
    imageBlocks: 0,
    internalLinks: 0,
    skippedContent: 0,
    tables: 0,
    textBlocks: 0,
    warnings: 0,
  },
  copyIssues: [],
  skippedContent: [],
  warnings: [],
};

const assetRefMap = new Map<string, string>();

function warn(message: string) {
  report.warnings.push(message);
  report.counts.warnings += 1;
}

function skip(message: string) {
  report.skippedContent.push(message);
  report.counts.skippedContent += 1;
}

function normalizeRootSlug(slug: string | null | undefined) {
  if (!slug?.trim()) {
    return "";
  }

  return `/${slug.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

function excerptToDescription(excerpt: LegacyBlock[] | null | undefined) {
  const text =
    excerpt
      ?.flatMap((block) => block.children ?? [])
      .map((child) => child.text ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim() ?? "";

  return text.length > 320 ? `${text.slice(0, 317).trim()}...` : text;
}

function createSourceMetadata(source: {
  _id: string;
  _type: string;
  _updatedAt?: string;
  slug?: { current?: string | null };
}) {
  return {
    _type: "object",
    dataset: SOURCE_DATASET,
    id: source._id,
    slug: source.slug?.current ?? "",
    sourceUpdatedAt: source._updatedAt,
    type: source._type,
  };
}

function toReference(id: string): Reference {
  return {
    _ref: id,
    _type: "reference",
  };
}

function patchable<T extends Record<string, unknown>>(document: T) {
  const fields = { ...document };
  delete fields._type;
  return fields;
}

async function ensureImageAsset(
  sourceClient: SanityClient,
  targetClient: SanityClient,
  image: LegacyImage | null | undefined
) {
  const sourceAssetId = image?.asset?._ref;
  if (!sourceAssetId) {
    warn("Image had no asset reference and was skipped.");
    return;
  }

  const mappedAssetId = assetRefMap.get(sourceAssetId);
  if (mappedAssetId) {
    report.counts.assetsReused += 1;
    return mappedAssetId;
  }

  const existing = await targetClient.fetch<string | null>(
    '*[_id == $assetId][0]._id',
    { assetId: sourceAssetId }
  );
  if (existing) {
    assetRefMap.set(sourceAssetId, existing);
    report.counts.assetsReused += 1;
    return existing;
  }

  const sourceAsset = await sourceClient.fetch<{
    _id: string;
    originalFilename?: string | null;
    url?: string | null;
  } | null>('*[_id == $assetId][0]{_id, originalFilename, url}', {
    assetId: sourceAssetId,
  });

  if (!sourceAsset?.url) {
    warn(`Source image asset ${sourceAssetId} was not found.`);
    return;
  }

  const response = await fetch(sourceAsset.url);
  if (!response.ok) {
    warn(`Failed to fetch image asset ${sourceAssetId}: ${response.status}`);
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const uploaded = await targetClient.assets.upload("image", buffer, {
    filename: sourceAsset.originalFilename ?? `${sourceAssetId}.jpg`,
  });

  report.counts.assetsUploaded += 1;
  assetRefMap.set(sourceAssetId, uploaded._id);
  return uploaded._id;
}

async function toTargetImage(
  sourceClient: SanityClient,
  targetClient: SanityClient,
  image: LegacyImage | null | undefined
): Promise<TargetImage | undefined> {
  const assetId = await ensureImageAsset(sourceClient, targetClient, image);
  if (!assetId) {
    return;
  }

  return {
    _type: "image",
    alt: image?.alt ?? null,
    asset: toReference(assetId),
  };
}

function createExternalCustomLink(href: string, openInNewTab = false) {
  return {
    _type: "customUrl",
    external: href,
    href,
    openInNewTab,
    type: "external",
  };
}

function convertMarkDef(
  markDef: LegacyMarkDef
): LegacyMarkDef | Record<string, unknown> {
  if (markDef._type === "link" && markDef.href) {
    report.counts.externalLinks += 1;
    return {
      _key: markDef._key,
      _type: "customLink",
      customLink: createExternalCustomLink(markDef.href, Boolean(markDef.blank)),
    };
  }

  if (markDef._type === "button" && markDef.href) {
    report.counts.buttonMarks += 1;
    return {
      _key: markDef._key,
      _type: "buttonLink",
      customLink: createExternalCustomLink(markDef.href, Boolean(markDef.blank)),
      variant: "default",
    };
  }

  if (markDef._type === "internalLink") {
    const href = normalizeRootSlug(markDef.referenceSlug);
    if (!href) {
      warn(
        `Internal link ${markDef._key} had no resolvable slug and was left as broken.`
      );
      return {
        _key: markDef._key,
        _type: "customLink",
        customLink: createExternalCustomLink("#", false),
      };
    }

    report.counts.internalLinks += 1;
    return {
      _key: markDef._key,
      _type: "customLink",
      customLink: createExternalCustomLink(href, false),
    };
  }

  warn(`Unsupported mark definition ${markDef._type} was preserved as-is.`);
  return markDef;
}

async function convertBody(
  sourceClient: SanityClient,
  targetClient: SanityClient,
  body: LegacyBodyItem[] | null | undefined
) {
  const converted = [];

  for (const item of body ?? []) {
    if (item._type === "block") {
      report.counts.textBlocks += 1;
      converted.push({
        ...item,
        markDefs: item.markDefs?.map(convertMarkDef) ?? [],
      });
      continue;
    }

    if (item._type === "mainImage") {
      const image = await toTargetImage(sourceClient, targetClient, item);
      if (image) {
        report.counts.imageBlocks += 1;
        converted.push({
          ...image,
          _key: item._key,
        });
      }
      continue;
    }

    if (item._type === "mytable") {
      report.counts.tables += 1;
      converted.push({
        _key: item._key,
        _type: "table",
        rows:
          item.generictable?.rows?.map((row, index) => ({
            _key: row._key ?? `${item._key}-row-${index}`,
            _type: "tableRow",
            cells: row.cells ?? [],
          })) ?? [],
        title: item.title ?? null,
      });
      continue;
    }

    skip(
      `Unsupported body item type ${(item as { _type: string })._type} was skipped.`
    );
  }

  return converted;
}

async function ensureAuthor(targetClient: SanityClient) {
  const existing = await targetClient.fetch<{ _id: string } | null>(
    '*[_type == "author" && name == $name][0]{_id}',
    { name: DEFAULT_AUTHOR_NAME }
  );

  if (existing?._id) {
    await targetClient
      .patch(existing._id)
      .set({ name: DEFAULT_AUTHOR_NAME })
      .commit();
    report.counts.authorsUpdated += 1;
    warn(
      "Legacy post had no author reference; reused default Jimmy Vercellino author."
    );
    return existing._id;
  }

  const created = await targetClient.create({
    _type: "author",
    name: DEFAULT_AUTHOR_NAME,
  });
  report.counts.authorsCreated += 1;
  warn(
    "Legacy post had no author reference; created default Jimmy Vercellino author."
  );
  return created._id;
}

async function ensureCategory(
  targetClient: SanityClient,
  category: LegacyCategory
) {
  const slug = normalizeRootSlug(category.slug?.current);
  const existing = await targetClient.fetch<{ _id: string } | null>(
    `*[
      _type == "category" &&
      (migrationSource.id == $sourceId || slug.current == $slug)
    ][0]{_id}`,
    { slug, sourceId: category._id }
  );
  const doc = {
    _type: "category",
    migrationSource: createSourceMetadata(category),
    slug: {
      _type: "slug",
      current: slug,
    },
    title: category.title ?? "Untitled Category",
  };

  if (existing?._id) {
    await targetClient.patch(existing._id).set(patchable(doc)).commit();
    report.counts.categoriesUpdated += 1;
    return existing._id;
  }

  const created = await targetClient.create(doc);
  report.counts.categoriesCreated += 1;
  return created._id;
}

function findCopyIssues(source: LegacyPost) {
  const bodyText = JSON.stringify(source.body ?? []);
  const issues = [];

  if (bodyText.includes("Morgage")) {
    issues.push('Legacy table copy contains "Morgage"; preserved as-is.');
  }

  return issues;
}

async function upsertBlog(
  targetClient: SanityClient,
  document: BlogDocument
) {
  const existing = await targetClient.fetch<{ _id: string } | null>(
    `*[
      _type == "blog" &&
      (migrationSource.id == $sourceId || slug.current == $slug)
    ][0]{_id}`,
    { slug: TARGET_SLUG, sourceId: SOURCE_ID }
  );

  if (existing?._id) {
    await targetClient.patch(existing._id).set(patchable(document)).commit();
    report.counts.blogsUpdated += 1;
    report.tracer.targetBlogId = existing._id;
    return existing._id;
  }

  const created = await targetClient.create(document);
  report.counts.blogsCreated += 1;
  report.tracer.targetBlogId = created._id;
  return created._id;
}

async function main() {
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
  const token =
    process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_API_READ_TOKEN;

  if (!projectId) {
    throw new Error("SANITY_STUDIO_PROJECT_ID is required.");
  }
  if (!token) {
    throw new Error("SANITY_API_WRITE_TOKEN is required.");
  }

  const sourceClient = createClient({
    projectId,
    dataset: SOURCE_DATASET,
    apiVersion: API_VERSION,
    token,
    useCdn: false,
  });
  const targetClient = createClient({
    projectId,
    dataset: TARGET_DATASET,
    apiVersion: API_VERSION,
    token,
    useCdn: false,
  });

  const source = await sourceClient.fetch<LegacyPost | null>(
    `*[_type == "post" && _id == $id][0]{
      _id,
      _type,
      _updatedAt,
      title,
      slug,
      excerpt,
      publishedAt,
      seoDescription,
      seoNoIndex,
      seoTitle,
      mainImage,
      categories[]->{_id, _type, _updatedAt, title, slug},
      body[]{
        ...,
        _type == "block" => {
          ...,
          markDefs[]{
            ...,
            _type == "internalLink" => {
              "referenceType": reference->_type,
              "referenceTitle": reference->title,
              "referenceSlug": reference->slug.current
            }
          }
        }
      }
    }`,
    { id: SOURCE_ID }
  );

  if (!source) {
    throw new Error(`Source post ${SOURCE_ID} was not found.`);
  }

  const existingBlogAsset = await targetClient.fetch<{
    mainImageRef?: string | null;
  } | null>(
    `*[
      _type == "blog" &&
      (migrationSource.id == $sourceId || slug.current == $slug)
    ][0]{
      "mainImageRef": image.asset._ref
    }`,
    { slug: TARGET_SLUG, sourceId: SOURCE_ID }
  );
  const sourceMainImageRef = source.mainImage?.asset?._ref;
  if (sourceMainImageRef && existingBlogAsset?.mainImageRef) {
    assetRefMap.set(sourceMainImageRef, existingBlogAsset.mainImageRef);
  }

  const mainImage = await toTargetImage(
    sourceClient,
    targetClient,
    source.mainImage
  );
  if (!mainImage) {
    throw new Error("The source post main image could not be migrated.");
  }

  const authorId = await ensureAuthor(targetClient);
  const categoryIds = [];
  for (const category of source.categories ?? []) {
    categoryIds.push(await ensureCategory(targetClient, category));
  }

  const richText = await convertBody(sourceClient, targetClient, source.body);
  report.copyIssues = findCopyIssues(source);

  const blogDocument = {
    _type: "blog" as const,
    authors: [
      {
        _key: "legacy-author-jimmy-vercellino",
        ...toReference(authorId),
      },
    ],
    categories: categoryIds.map((id) => ({
      _key: `legacy-category-${id}`,
      ...toReference(id),
    })),
    description: source.seoDescription ?? excerptToDescription(source.excerpt),
    image: mainImage,
    migrationSource: createSourceMetadata(source),
    publishedAt: source.publishedAt?.slice(0, 10),
    richText,
    seoDescription: source.seoDescription,
    seoHideFromLists: false,
    seoNoIndex: source.seoNoIndex ?? false,
    seoTitle: source.seoTitle,
    slug: {
      _type: "slug",
      current: TARGET_SLUG,
    },
    title: source.title,
  };

  await upsertBlog(targetClient, blogDocument);

  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  // biome-ignore lint/suspicious/noConsole: CLI reports the written artifact.
  console.log(`Migration complete. Report written to ${REPORT_PATH}`);
}

main().catch((error) => {
  // biome-ignore lint/suspicious/noConsole: CLI should print fatal errors.
  console.error(error);
  process.exitCode = 1;
});
