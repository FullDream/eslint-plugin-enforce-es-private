import { createRule } from '../utils.js'
import { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { safePrivateFix } from '../common/safe-private-fix'

const name = 'typescript-private'

const memberKinds = ['fields', 'methods', 'getters', 'setters', 'autoAccessors'] as const

type MemberKind = (typeof memberKinds)[number]
type Options = [{ members?: MemberKind[] }]
type MessageIds = 'enforceEsPrivateField' | 'enforceEsPrivateMethod'
type ClassMember =
	| TSESTree.PropertyDefinition
	| TSESTree.MethodDefinition
	| TSESTree.TSAbstractPropertyDefinition
	| TSESTree.TSAbstractMethodDefinition
	| TSESTree.AccessorProperty

function getMemberKind(node: ClassMember): MemberKind | undefined {
	if (node.type === 'AccessorProperty') {
		return 'autoAccessors'
	}

	if (node.type === 'MethodDefinition' || node.type === 'TSAbstractMethodDefinition') {
		if (node.kind === 'constructor') {
			return
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

function createListeners(
	context: Pick<TSESLint.RuleContext<MessageIds, []>, 'sourceCode' | 'report'>,
	enabledMembers: ReadonlySet<MemberKind>,
): TSESLint.RuleListener {
	function check(node: ClassMember) {
		const memberKind = getMemberKind(node)

		if (node.accessibility !== 'private' || !memberKind || !enabledMembers.has(memberKind)) {
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
	}
}

export const rule = createRule<Options, MessageIds>({
	name,
	defaultOptions: [{}],
	meta: {
		type: 'suggestion',
		fixable: 'code',
		docs: {
			description: "Enforce the use of native ES private fields ('#') instead of 'private' modifier.",
			recommended: false,
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
		return createListeners(context, new Set(options.members ?? memberKinds))
	},
})

function createMemberRule(ruleName: string, member: MemberKind) {
	return createRule<[], MessageIds>({
		name: ruleName,
		defaultOptions: [],
		meta: {
			type: rule.meta.type,
			fixable: rule.meta.fixable,
			messages: rule.meta.messages,
			docs: {
				description: `Prefer native ES private ${ruleName} over TypeScript private declarations.`,
				recommended: true,
			},
			schema: [],
		},
		create(context) {
			return createListeners(context, new Set([member]))
		},
	})
}

export const memberRules = {
	fields: createMemberRule('fields', 'fields'),
	methods: createMemberRule('methods', 'methods'),
	getters: createMemberRule('getters', 'getters'),
	setters: createMemberRule('setters', 'setters'),
	'auto-accessors': createMemberRule('auto-accessors', 'autoAccessors'),
} as const

export default { name, rule } as const
