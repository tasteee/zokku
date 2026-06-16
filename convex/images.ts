import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'
import type { Id } from './_generated/dataModel'

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error('Not authenticated')
		return await ctx.storage.generateUploadUrl()
	}
})

export const getImageUrl = mutation({
	args: { storageId: v.string() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error('Not authenticated')
		const url = await ctx.storage.getUrl(args.storageId as Id<'_storage'>)
		return url
	}
})
