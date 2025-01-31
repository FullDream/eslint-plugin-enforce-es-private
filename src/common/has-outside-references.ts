import { TSESLint, TSESTree } from '@typescript-eslint/utils'

export function hasOutsideReferences(
	context: TSESLint.RuleContext<string, unknown[]>,
	classBody: TSESTree.ClassBody,
	originalName: string,
): boolean {
	const { ast: root } = context.sourceCode

	const stack: TSESTree.Node[] = [root]

	while (stack.length > 0) {
		const node = stack.pop()!

		if (node.type === 'Identifier' && node.name === originalName) {
			if (node.range[0] < classBody.range[0] || node.range[1] > classBody.range[1]) {
				return true
			}
		}

		for (const key in node) {
			if (key === 'parent') continue

			const value = (node as any)[key]

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

	return false
}
