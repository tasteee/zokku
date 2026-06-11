import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    authorId: v.id("users"),
    folderId: v.optional(v.id("folders")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_author_folder", ["authorId", "folderId"]),
  folders: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    authorId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_author", ["authorId"]),
});
