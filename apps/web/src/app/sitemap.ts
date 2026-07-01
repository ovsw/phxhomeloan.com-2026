import { sanityFetchMetadata } from "@workspace/sanity/live";
import { querySitemapData } from "@workspace/sanity/query";
import type { QuerySitemapDataResult } from "@workspace/sanity/types";
import type { MetadataRoute } from "next";

import { getBaseUrl, withTrailingSlash } from "@/utils";

type SitemapItem =
  | QuerySitemapDataResult["slugPages"][number]
  | QuerySitemapDataResult["blogPages"][number];

const baseUrl = getBaseUrl();

function toSitemapEntry(
  page: SitemapItem,
  priority: number
): MetadataRoute.Sitemap[number] | undefined {
  if (!page.slug) {
    return;
  }

  return {
    url: `${baseUrl}${withTrailingSlash(page.slug)}`,
    lastModified: new Date(page.lastModified ?? new Date()),
    changeFrequency: "weekly",
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await sanityFetchMetadata({
    query: querySitemapData,
    perspective: "published",
  });
  const { slugPages, blogPages } = data ?? { slugPages: [], blogPages: [] };
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...slugPages.flatMap((page) => toSitemapEntry(page, 0.8) ?? []),
    ...blogPages.flatMap((page) => toSitemapEntry(page, 0.5) ?? []),
  ];
}
