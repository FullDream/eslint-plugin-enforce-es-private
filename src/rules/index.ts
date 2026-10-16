import typescriptPrivate, { memberRules } from './typescript-private'

export const rules = {
	[typescriptPrivate.name]: typescriptPrivate.rule,
	...memberRules,
} as const
