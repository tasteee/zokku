import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		const documents = await ctx.db
			.query('documents')
			.withIndex('by_author', (queryBuilder) => queryBuilder.eq('authorId', userId))
			.collect()

		return documents.sort((a, b) => b.updatedAt - a.updatedAt)
	}
})

export const get = query({
	args: { id: v.id('documents') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return null

		const document = await ctx.db.get(args.id)
		const isOwner = document?.authorId === userId
		if (!document || !isOwner) return null

		return document
	}
})

export const create = mutation({
	args: {
		folderId: v.optional(v.id('folders'))
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error('Not authenticated')

		if (args.folderId) {
			const folder = await ctx.db.get(args.folderId)
			const isFolderOwner = folder?.authorId === userId
			if (!folder || !isFolderOwner) throw new Error('Folder not found')
		}

		const now = Date.now()

		const documentId = await ctx.db.insert('documents', {
			title: 'Untitled',
			content: '',
			authorId: userId,
			folderId: args.folderId,
			createdAt: now,
			updatedAt: now
		})

		return documentId
	}
})

export const move = mutation({
	args: {
		id: v.id('documents'),
		folderId: v.optional(v.id('folders'))
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error('Not authenticated')

		const document = await ctx.db.get(args.id)
		const isOwner = document?.authorId === userId
		if (!document || !isOwner) throw new Error('Document not found')

		if (args.folderId) {
			const folder = await ctx.db.get(args.folderId)
			const isFolderOwner = folder?.authorId === userId
			if (!folder || !isFolderOwner) throw new Error('Folder not found')
		}

		await ctx.db.patch(args.id, {
			folderId: args.folderId,
			updatedAt: Date.now()
		})
	}
})

export const update = mutation({
	args: {
		id: v.id('documents'),
		title: v.optional(v.string()),
		content: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error('Not authenticated')

		const document = await ctx.db.get(args.id)
		const isOwner = document?.authorId === userId
		if (!document || !isOwner) throw new Error('Document not found')

		const patch: Record<string, string | number> = { updatedAt: Date.now() }
		if (args.title !== undefined) patch.title = args.title
		if (args.content !== undefined) patch.content = args.content

		await ctx.db.patch(args.id, patch)
	}
})

export const remove = mutation({
	args: { id: v.id('documents') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error('Not authenticated')

		const document = await ctx.db.get(args.id)
		const isOwner = document?.authorId === userId
		if (!document || !isOwner) throw new Error('Document not found')

		await ctx.db.delete(args.id)
	}
})
