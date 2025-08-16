import { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { RuleFixer } from '@typescript-eslint/utils/ts-eslint'

export function replaceAllReferencesInClass<R extends TSESLint.RuleContext<string, []>>(
	node: TSESTree.PropertyDefinition | TSESTree.MethodDefinition,
	context: R,
	originalName: string,
	privateName: string,
): ((fixer: RuleFixer) => TSESLint.RuleFix[]) | null {
	const classBody = node.parent
	if (!classBody || classBody.type !== 'ClassBody') {
		return null
	}

	const stack: TSESTree.Node[] = [classBody]
	const identifiersToReplace: TSESTree.Identifier[] = []

	while (stack.length > 0) {
		const current = stack.pop()!

		if (current.type === 'Identifier' && current.name === originalName) {
			identifiersToReplace.push(current)
		}

		for (const key in current) {
			if (key === 'parent') continue

			const value = (current as any)[key]
			if (Array.isArray(value)) {
				for (const child of value) {
					if (child && typeof child === 'object' && 'type' in child) {
						stack.push(child)
					}
				}
			} else if (value && typeof value === 'object' && 'type' in value) {
				stack.push(value)
			}
		}
	}

	return (fixer: RuleFixer) => {
		return identifiersToReplace.map(idNode => fixer.replaceText(idNode, privateName))
	}
}
