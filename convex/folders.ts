import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		const folders = await ctx.db
			.query('folders')
			.withIndex('by_author', (queryBuilder) => queryBuilder.eq('authorId', userId))
			.collect()

		return folders.sort((a, b) => a.name.localeCompare(b.name))
	}
})

export const create = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error('Not authenticated')

		const name = args.name.trim()
		const description = args.description?.trim()
		if (!name) throw new Error('Folder name is required')

		const now = Date.now()

		return await ctx.db.insert('folders', {
			name,
			description: description || undefined,
			authorId: userId,
			createdAt: now,
			updatedAt: now
		})
	}
})

export const remove = mutation({
	args: { id: v.id('folders') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error('Not authenticated')

		const folder = await ctx.db.get(args.id)
		const isOwner = folder?.authorId === userId
		if (!folder || !isOwner) throw new Error('Folder not found')

		const documents = await ctx.db
			.query('documents')
			.withIndex('by_author_folder', (queryBuilder) => queryBuilder.eq('authorId', userId).eq('folderId', args.id))
			.collect()

		await Promise.all(documents.map((document) => ctx.db.patch(document._id, { folderId: undefined })))
		await ctx.db.delete(args.id)
	}
})
