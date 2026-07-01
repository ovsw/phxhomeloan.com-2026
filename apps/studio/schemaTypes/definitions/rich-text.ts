import { ImageIcon, LinkIcon } from "@sanity/icons";
import { Table2Icon } from "lucide-react";
import {
  type ConditionalProperty,
  defineArrayMember,
  defineField,
  defineType,
} from "sanity";

import { createRadioListLayout } from "@/utils/helper";

const richTextMembers = [
  defineArrayMember({
    name: "block",
    type: "block",
    styles: [
      { title: "Normal", value: "normal" },
      { title: "H2", value: "h2" },
      { title: "H3", value: "h3" },
      { title: "H4", value: "h4" },
      { title: "H5", value: "h5" },
      { title: "H6", value: "h6" },
      { title: "Inline", value: "inline" },
    ],
    lists: [
      { title: "Numbered", value: "number" },
      { title: "Bullet", value: "bullet" },
    ],
    marks: {
      annotations: [
        {
          name: "customLink",
          type: "object",
          title: "Internal/External Link",
          icon: LinkIcon,
          fields: [
            defineField({
              name: "customLink",
              type: "customUrl",
            }),
          ],
        },
        {
          name: "buttonLink",
          type: "object",
          title: "Button Link",
          icon: LinkIcon,
          fields: [
            defineField({
              name: "variant",
              type: "string",
              title: "Button Style",
              description:
                "Choose how this inline button should look on the website",
              initialValue: () => "default",
              options: createRadioListLayout([
                "default",
                "secondary",
                "outline",
                "link",
              ]),
            }),
            defineField({
              name: "customLink",
              type: "customUrl",
              title: "Button Destination",
              description:
                "Choose where this inline button should send visitors",
            }),
          ],
        },
      ],
      decorators: [
        { title: "Strong", value: "strong" },
        { title: "Emphasis", value: "em" },
        { title: "Code", value: "code" },
      ],
    },
  }),
  defineArrayMember({
    name: "image",
    title: "Image",
    type: "image",
    icon: ImageIcon,
    options: {
      hotspot: true,
    },
    fields: [
      defineField({
        name: "caption",
        type: "string",
        title: "Caption Text",
      }),
    ],
  }),
  defineArrayMember({
    name: "table",
    title: "Table",
    type: "object",
    icon: Table2Icon,
    fields: [
      defineField({
        name: "title",
        type: "string",
        title: "Table Title",
        description:
          "A short internal label that identifies what this table contains",
      }),
      defineField({
        name: "rows",
        type: "array",
        title: "Rows",
        description:
          "The table rows, with the first row used as the table header",
        of: [
          defineArrayMember({
            name: "tableRow",
            type: "object",
            title: "Table Row",
            fields: [
              defineField({
                name: "cells",
                type: "array",
                title: "Cells",
                description:
                  "The text cells for this row, ordered from left to right",
                of: [
                  defineArrayMember({
                    type: "string",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
    preview: {
      select: {
        title: "title",
        rows: "rows",
      },
      prepare: ({ title, rows }) => ({
        title: title || "Table",
        subtitle: `${Array.isArray(rows) ? rows.length : 0} rows`,
      }),
    },
  }),
];

export const richText = defineType({
  name: "richText",
  type: "array",
  of: richTextMembers,
});

export const memberTypes = richTextMembers.map((member) => member.name);

type Type = NonNullable<(typeof memberTypes)[number]>;

export const customRichText = (
  type: Type[],
  options?: {
    name?: string;
    title?: string;
    group?: string[] | string;
    description?: string;
    hidden?: ConditionalProperty;
  }
) => {
  const { name, description, hidden } = options ?? {};
  const customMembers = richTextMembers.filter(
    (member) => member.name && type.includes(member.name)
  );
  return defineField({
    ...options,
    name: name ?? "richText",
    type: "array",
    description: description ?? "",
    hidden,
    of: customMembers,
  });
};
