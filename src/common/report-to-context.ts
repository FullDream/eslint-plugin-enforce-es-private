import { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { hasOutsideReferences } from './has-outside-references'
import { replaceAllReferencesInClass } from './replace-all-references-in-class'

interface ReportToContext {
	node: TSESTree.PropertyDefinition | TSESTree.MethodDefinition
	context: TSESLint.RuleContext<string, []>
	originalName: string
	isTypeScriptPrivate: boolean
	type: 'Method' | 'Field'
}

function processString(input: string): string {
	if (input.startsWith('_')) return `#${input.slice(1)}`

	if (!input.startsWith('#')) return `#${input}`

	return input
}

export function reportToContext({ context, originalName, isTypeScriptPrivate, node, type }: ReportToContext): void {
	const classBody = node.parent

	if (!classBody || classBody.type !== 'ClassBody') {
		return
	}

	if (hasOutsideReferences(context, classBody, originalName)) {
		context.report({
			node,
			messageId: `enforceEsPrivate${type}Outside`,
			data: { name: originalName },
		})
		return
	}

	context.report({
		node,
		messageId: `enforceEsPrivate${type}`,
		fix: fixer => {
			const fixes = []
			const privateName = processString(originalName)

			const fixRefs = replaceAllReferencesInClass(node, context, originalName, privateName)
			if (fixRefs) {
				fixes.push(...fixRefs(fixer))
			}

			if (isTypeScriptPrivate) {
				const privateToken = context.sourceCode.getFirstToken(node, {
					filter: t => t.value === 'private',
				})

				if (privateToken) fixes.push(fixer.remove(privateToken))
			}

			return fixes
		},
	})
}
