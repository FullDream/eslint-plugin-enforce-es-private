import { ESLintUtils } from '@typescript-eslint/utils'

export interface EnforceEsPrivateDocs {
	description: string
	recommended?: boolean
	requiresTypeChecking?: boolean
}

export const createRule = ESLintUtils.RuleCreator<EnforceEsPrivateDocs>(
	name => `https://github.com/FullDream/eslint-plugin-enforce-es-private/docs/${name}.md`,
)
