import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const postsCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		comment: z.boolean().optional().default(true),
		priority: z.number().optional(),
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),

		/* Page encryption fields */
		encrypted: z.boolean().optional().default(false),
		password: z.string().optional().default(""),

		/* Posts alias */
		alias: z.string().optional(),

		/* Custom permalink - 自定义固定链接，优先级高于 alias */
		permalink: z.string().optional(),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});
const specCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/spec" }),
	schema: z.object({}),
});
const diaryCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/diary" }),
	schema: z.object({
		date: z.date(),
		title: z.string().optional().default(""),
		mood: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		postId: z.union([z.string(), z.number()]).optional(),
		images: z
			.array(
				z.union([
					z.string(),
					z.object({
						src: z.string(),
						alt: z.string().optional().default(""),
					}),
				]),
			)
			.optional()
			.default([]),
		reply: z
			.object({
				id: z.union([z.string(), z.number()]).optional(),
				text: z.string(),
				title: z.string().optional().default("Reply to:"),
				image: z.string().optional().default(""),
			})
			.optional(),
		draft: z.boolean().optional().default(false),
	}),
});
export const collections = {
	posts: postsCollection,
	spec: specCollection,
	diary: diaryCollection,
};
