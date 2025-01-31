import { createRule } from '../utils'
import { TSESTree } from '@typescript-eslint/utils'
import { reportToContext } from '../common/report-to-context'


const name = 'underscore-prefix'

const rule = createRule({
	name,
	defaultOptions: [],
	create(context) {
		return {
			PropertyDefinition(node: TSESTree.PropertyDefinition) {
				if (
					node.key.type === 'Identifier' &&
					node.key.name.startsWith('_')
				) {
					reportToContext({
						context,
						originalName: node.key.name,
						isTypeScriptPrivate: false,
						type: 'Field',
						node,
					})
				}
			},
			MethodDefinition(node: TSESTree.MethodDefinition) {
				if (
					node.key.type === 'Identifier' &&
					node.key.name.startsWith('_')
				) {
					reportToContext({
						context,
						originalName: node.key.name,
						isTypeScriptPrivate: false,
						type: 'Method',
						node,
					})

				}
			}
		};
	},

	meta: {
		type: 'suggestion',
		fixable: 'code',
		docs: {
			description:
				"Enforce the use of native ES private fields and methods ('#') instead of underscore('_') prefix.",
			recommended: true,
			requiresTypeChecking: true,
		},
		messages: {
			enforceEsPrivateField: "Use native ES private fields ('#') instead of underscore('_') prefix.",
			enforceEsPrivateFieldOutside:
				"Use native ES private fields ('#') instead of underscore('_') prefix. Property \"{{name}}\" is referenced outside the class — remove reference",
			enforceEsPrivateMethod: "Use native ES private methods ('#') instead of underscore('_') prefix.",
			enforceEsPrivateMethodOutside:
				"Use native ES private methods ('#') instead of underscore('_') prefix. Property \"{{name}}\" is referenced outside the class — remove reference",
		},
		schema: [],
	},
})


export default { name, rule } as const
