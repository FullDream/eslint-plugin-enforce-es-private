import typescriptPrivate from './typescript-private'
import underscorePrefix from './underscore-prefix'

export const rules = {
	[typescriptPrivate.name]: typescriptPrivate.rule,
	[underscorePrefix.name]: underscorePrefix.rule,
} as const
