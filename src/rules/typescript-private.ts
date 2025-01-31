import { createRule } from '../utils.js'
import { TSESTree } from '@typescript-eslint/utils'
import { reportToContext } from '../common/report-to-context'

const name = 'typescript-private'

export const rule = createRule({
	name,
	defaultOptions: [],
	meta: {
		type: 'suggestion',
		fixable: 'code',
		docs: {
			description: "Enforce the use of native ES private fields ('#') instead of 'private' modifier.",
			recommended: true,
			requiresTypeChecking: true,
		},
		messages: {
			enforceEsPrivateField: "Use native ES private fields ('#') instead of 'private' modifier.",
			enforceEsPrivateFieldOutside:
				"Use native ES private fields ('#') instead of 'private' modifier. Property \"{{name}}\" is referenced outside the class — remove reference",
			enforceEsPrivateMethod: "Use native ES private methods ('#') instead of 'private' modifier.",
			enforceEsPrivateMethodOutside:
				"Use native ES private methods ('#') instead of 'private' modifier. Property \"{{name}}\" is referenced outside the class — remove reference",
		},
		schema: [],
	},
	create(context) {
		return {
			MethodDefinition(node: TSESTree.MethodDefinition) {
				if (node.accessibility === 'private' && node.key.type === 'Identifier') {
					reportToContext({
						context,
						originalName: node.key.name,
						isTypeScriptPrivate: true,
						type: 'Field',
						node,
					})
				}
			},

			PropertyDefinition(node: TSESTree.PropertyDefinition) {
				if (node.accessibility === 'private' && node.key.type === 'Identifier')
					reportToContext({
						context,
						originalName: node.key.name,
						isTypeScriptPrivate: true,
						type: 'Field',
						node,
					})
			},
		}
	},
})

export default { name, rule } as const
