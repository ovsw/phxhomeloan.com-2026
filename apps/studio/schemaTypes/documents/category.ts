import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

import { documentSlugField } from "@/schemaTypes/common";
import { GROUP, GROUPS } from "@/utils/constant";

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: TagIcon,
  groups: GROUPS,
  description:
    "A topic used to group educational articles and future category listing pages.",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The category name shown to editors and visitors.",
      group: GROUP.MAIN_CONTENT,
      validation: (Rule) =>
        Rule.required().error("A category title is required"),
    }),
    documentSlugField("category", {
      group: GROUP.MAIN_CONTENT,
      description:
        "The root web address for this category, automatically created from the title.",
    }),
    defineField({
      name: "migrationSource",
      type: "object",
      title: "Migration Source",
      description:
        "Read-only source metadata used to safely rerun content migrations.",
      readOnly: true,
      group: GROUP.RELATED,
      fields: [
        defineField({
          name: "dataset",
          type: "string",
          title: "Source Dataset",
          description: "The Sanity dataset this category was migrated from.",
        }),
        defineField({
          name: "type",
          type: "string",
          title: "Source Type",
          description: "The legacy document type this category came from.",
        }),
        defineField({
          name: "id",
          type: "string",
          title: "Source ID",
          description: "The legacy Sanity document ID for this category.",
        }),
        defineField({
          name: "slug",
          type: "string",
          title: "Source Slug",
          description: "The legacy slug value before root-path normalization.",
        }),
        defineField({
          name: "sourceUpdatedAt",
          type: "datetime",
          title: "Source Updated At",
          description:
            "The last updated timestamp from the legacy category document.",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug.current",
    },
    prepare: ({ title, slug }) => ({
      title: title || "Untitled Category",
      subtitle: slug ? `Root path: ${slug}` : "No URL set",
    }),
  },
});
