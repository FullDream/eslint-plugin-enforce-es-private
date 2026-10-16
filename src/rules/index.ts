import typescriptPrivate from './typescript-private'

export const rules = {
	[typescriptPrivate.name]: typescriptPrivate.rule,
} as const
