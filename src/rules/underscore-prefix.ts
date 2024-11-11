import { createRule } from '../utils'
import { TSESTree } from '@typescript-eslint/utils'
import { RuleContext, RuleFixer } from '@typescript-eslint/utils/ts-eslint'


type MessageIds = 'enforceEsPrivateField' | 'enforceEsPrivateMethod';
type Options = [];

const name = 'underscore-prefix'

const rule = createRule<Options, MessageIds>({
	name,
	defaultOptions: [],
	create(context) {
		return {
			PropertyDefinition(node: TSESTree.PropertyDefinition) {
				if (
					node.key.type === 'Identifier' &&
					node.key.name.startsWith('_') &&
					!node.static
				) {
					const originalName = node.key.name;
					const privateName = `#${originalName.slice(1)}`;
					const fix = replaceAllReferencesInClass(node, context, originalName, privateName);

					if (fix) {
						context.report({
							node: node.key,
							messageId: "enforceEsPrivateField",
							fix
						});
					}
				}
			},
			MethodDefinition(node: TSESTree.MethodDefinition) {
				if (
					node.key.type === 'Identifier' &&
					node.key.name.startsWith('_') &&
					!node.static
				) {
					const originalName = node.key.name;
					const privateName = `#${originalName.slice(1)}`;
					const fix = replaceAllReferencesInClass(node, context, originalName, privateName);

					if (fix) {
						context.report({
							node: node.key,
							messageId: "enforceEsPrivateMethod",
							fix
						});
					}
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
			enforceEsPrivateMethod: "Use native ES private methods ('#') instead of underscore('_') prefix.",
		},
		schema: [],
	},
})


const replaceAllReferencesInClass = (
	node: TSESTree.PropertyDefinition | TSESTree.MethodDefinition,
	context: RuleContext<MessageIds, Options>,
	originalName: string,
	privateName: string
) => {
	const classBody = node.parent?.type === 'ClassBody' ? node.parent : null;

	if (classBody) {
		let classText = context.sourceCode.getText(classBody);

		const regex = new RegExp(`\\b${originalName}\\b`, 'g');
		classText = classText.replace(regex, privateName);

		return (fixer: RuleFixer) => fixer.replaceText(classBody, classText);
	}

	return null;
}

export default { name, rule } as const
