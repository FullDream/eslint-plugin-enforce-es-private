import { createRule } from './utils.js'
import { TSESTree } from '@typescript-eslint/utils'

export const rules = {
	'enforce-es-private': createRule({
		name: 'enforce-es-private',
		defaultOptions: [],
		create(context) {
			return {
				MethodDefinition(node: TSESTree.MethodDefinition) {
					if (node.accessibility === 'private') {
						context.report({
							node,
							messageId: 'enforceEsPrivateMethod',
						})
					}
				},
				PropertyDefinition(node: TSESTree.PropertyDefinition) {
					if (node.accessibility === 'private') {
						context.report({
							node,
							messageId: 'enforceEsPrivateField',
						})
					}
				},
			}
		},
		meta: {
			type: 'suggestion',
			fixable: 'code',
			docs: {
				description:
					"Enforce the use of native ES private fields and methods ('#') instead of 'private' modifier.",
				recommended: true,
				requiresTypeChecking: true,
			},
			messages: {
				enforceEsPrivateField: "Use native ES private fields ('#') instead of 'private' modifier.",
				enforceEsPrivateMethod: "Use native ES private methods ('#') instead of 'private' modifier.",
			},
			schema: [],
		},
	}),
}
