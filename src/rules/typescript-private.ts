import { createRule } from '../utils.js'
import { TSESTree } from '@typescript-eslint/utils'
import { safePrivateFix } from '../common/safe-private-fix'

const name = 'typescript-private'

const memberKinds = [
	'fields',
	'methods',
	'getters',
	'setters',
	'autoAccessors',
	'parameterProperties',
	'constructors',
] as const

type MemberKind = (typeof memberKinds)[number]
type Options = [{ members?: MemberKind[] }]
type MessageIds = 'enforceEsPrivateField' | 'enforceEsPrivateMethod'
type ClassMember =
	| TSESTree.PropertyDefinition
	| TSESTree.MethodDefinition
	| TSESTree.TSAbstractPropertyDefinition
	| TSESTree.TSAbstractMethodDefinition
	| TSESTree.AccessorProperty
	| TSESTree.TSParameterProperty

function getMemberKind(node: ClassMember): MemberKind {
	if (node.type === 'TSParameterProperty') {
		return 'parameterProperties'
	}

	if (node.type === 'AccessorProperty') {
		return 'autoAccessors'
	}

	if (node.type === 'MethodDefinition' || node.type === 'TSAbstractMethodDefinition') {
		if (node.kind === 'constructor') {
			return 'constructors'
		}

		if (node.kind === 'get') {
			return 'getters'
		}

		if (node.kind === 'set') {
			return 'setters'
		}

		return 'methods'
	}

	return 'fields'
}

export const rule = createRule<Options, MessageIds>({
	name,
	defaultOptions: [{}],
	meta: {
		type: 'suggestion',
		fixable: 'code',
		docs: {
			description: "Enforce the use of native ES private fields ('#') instead of 'private' modifier.",
			recommended: true,
		},
		messages: {
			enforceEsPrivateField: "Use native ES private fields ('#') instead of 'private' modifier.",
			enforceEsPrivateMethod: "Use native ES private methods ('#') instead of 'private' modifier.",
		},
		schema: [
			{
				type: 'object',
				properties: {
					members: {
						type: 'array',
						items: { type: 'string', enum: [...memberKinds] },
						uniqueItems: true,
					},
				},
				additionalProperties: false,
			},
		],
	},
	create(context, [options]) {
		const enabledMembers = new Set(options.members ?? memberKinds)

		function check(node: ClassMember) {
			if (node.accessibility !== 'private' || !enabledMembers.has(getMemberKind(node))) {
				return
			}

			context.report({
				node,
				messageId:
					node.type === 'MethodDefinition' || node.type === 'TSAbstractMethodDefinition'
						? 'enforceEsPrivateMethod'
						: 'enforceEsPrivateField',
				fix: safePrivateFix(context, node),
			})
		}

		return {
			MethodDefinition: check,
			PropertyDefinition: check,
			TSAbstractPropertyDefinition: check,
			TSAbstractMethodDefinition: check,
			AccessorProperty: check,
			TSParameterProperty: check,
		}
	},
})

export default { name, rule } as const
