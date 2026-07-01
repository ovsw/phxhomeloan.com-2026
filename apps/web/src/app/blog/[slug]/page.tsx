import { Logger } from "@workspace/logger";
import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetch,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@workspace/sanity/live";
import { queryBlogPaths, queryBlogSlugPageData } from "@workspace/sanity/query";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BlogPostContent } from "@/components/blog-post";
import { getSEOMetadata } from "@/lib/seo";

const logger = new Logger("BlogSlug");

const PLACEHOLDER_SLUG = "__placeholder__";

type BlogParams = { slug: string };

function getRootBlogSlug(slug: string) {
  return `/${slug}`;
}

function getLegacyBlogRouteSlug(slug: string) {
  const parts = slug.split("/").filter(Boolean);
  return parts[0] === "blog" ? parts[1] : undefined;
}

export async function generateStaticParams() {
  try {
    const { data: slugs } = await sanityFetchStaticParams({
      query: queryBlogPaths,
    });

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return [{ slug: PLACEHOLDER_SLUG }];
    }

    const paths: BlogParams[] = [];
    for (const slug of slugs) {
      if (!slug) {
        continue;
      }
      const path = getLegacyBlogRouteSlug(slug);
      if (path) {
        paths.push({ slug: path });
      }
    }

    if (paths.length === 0) {
      return [{ slug: PLACEHOLDER_SLUG }];
    }

    return paths;
  } catch (error) {
    logger.error("Error fetching blog paths", error);
    return [{ slug: PLACEHOLDER_SLUG }];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<BlogParams>;
}) {
  const [{ slug }, { perspective }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const slugString = getRootBlogSlug(slug);
  const { data } = await sanityFetchMetadata({
    query: queryBlogSlugPageData,
    params: { slug: slugString },
    perspective,
  });
  return getSEOMetadata({
    title: data?.title ?? data?.seoTitle,
    description: data?.description ?? data?.seoDescription,
    slug: slugString,
    contentId: data?._id,
    contentType: data?._type,
    seoNoIndex: data?.seoNoIndex,
    pageType: "article",
  });
}

export default async function BlogSlugPage({
  params,
}: {
  params: Promise<BlogParams>;
}) {
  const { isEnabled: isDraftMode } = await draftMode();
  if (isDraftMode) {
    return (
      <Suspense fallback={<BlogFallback />}>
        <DynamicBlogPage params={params} />
      </Suspense>
    );
  }
  const { slug } = await params;
  const data = await getCachedBlogPage({
    slug,
    perspective: "published",
    stega: false,
  });
  if (!data) {
    notFound();
  }
  return <BlogPageContent data={data} />;
}

async function DynamicBlogPage({ params }: { params: Promise<BlogParams> }) {
  const [{ slug }, { perspective, stega }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const data = await getCachedBlogPage({ slug, perspective, stega });
  if (!data) {
    notFound();
  }
  return <BlogPageContent data={data} />;
}

// notFound() stays in the non-cached callers above — never inside `'use cache'`.
async function getCachedBlogPage({
  slug,
  perspective,
  stega,
}: BlogParams & DynamicFetchOptions) {
  "use cache";
  const slugString = getRootBlogSlug(slug);
  const { data } = await sanityFetch({
    query: queryBlogSlugPageData,
    params: { slug: slugString },
    perspective,
    stega,
  });
  return data;
}

function BlogPageContent({
  data,
}: {
  data: NonNullable<Awaited<ReturnType<typeof getCachedBlogPage>>>;
}) {
  return <BlogPostContent data={data} />;
}

function BlogFallback() {
  return <div className="min-h-[50vh]" />;
}
