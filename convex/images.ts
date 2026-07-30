import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

export const generateUploadUrl = mutation({
	args: {},
	returns: v.string(),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error('Not authenticated')
		return await ctx.storage.generateUploadUrl()
	}
})

export const getMediaUrl = mutation({
	args: { storageId: v.id('_storage') },
	returns: v.union(v.string(), v.null()),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new Error('Not authenticated')
		return await ctx.storage.getUrl(args.storageId)
	}
})
