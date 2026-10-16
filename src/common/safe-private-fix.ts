import { TSESLint, TSESTree } from '@typescript-eslint/utils'
import ts from 'typescript'

/** Only rename resolved symbols. Dynamic operations need manual migration. */
export function safePrivateFix(
	context: Pick<TSESLint.RuleContext<string, []>, 'sourceCode'>,
	node: TSESTree.Node,
): TSESLint.ReportFixFunction | undefined {
	if (node.type !== 'PropertyDefinition' && node.type !== 'MethodDefinition') {
		return
	}

	if (node.computed || node.key.type !== 'Identifier' || node.decorators.length) {
		return
	}

	if (node.type === 'PropertyDefinition' && (node.declare || node.override)) {
		return
	}

	if (node.type === 'MethodDefinition' && (!node.value.body || node.override)) {
		return
	}

	const services = context.sourceCode.parserServices

	if (!services?.program || !services.esTreeNodeToTSNodeMap) {
		return
	}

	const target =
		services.program.getCompilerOptions().target ?? ts.getDefaultCompilerOptions().target ?? ts.ScriptTarget.ES5

	if (target < ts.ScriptTarget.ES2015) {
		return
	}

	const declaration = services.esTreeNodeToTSNodeMap.get(node)
	const key = services.esTreeNodeToTSNodeMap.get(node.key)
	const owner = declaration.parent

	if (!ts.isClassLike(owner)) {
		return
	}

	const classOwner: ts.ClassLikeDeclaration = owner

	if (
		owner.getSourceFile().isDeclarationFile ||
		owner.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DeclareKeyword)
	) {
		return
	}

	const checker = services.program.getTypeChecker()
	const symbol = checker.getSymbolAtLocation(key)

	if (!symbol) {
		return
	}

	const name = node.key.name
	const isStatic = node.static
	const classSymbol = owner.name && checker.getSymbolAtLocation(owner.name)

	// Accessor pairs and overloads need a coordinated migration.
	if (symbol.declarations?.length !== 1 || name === 'constructor') {
		return
	}

	if (
		owner.members.some(
			member => member.name && ts.isPrivateIdentifier(member.name) && member.name.text === `#${name}`,
		)
	) {
		return
	}

	const source = declaration.getSourceFile()
	const replacements: ts.Node[] = [key]
	let unsafe = false

	function sameSymbol(candidate: ts.Symbol | undefined): boolean {
		return candidate === symbol || !!candidate?.declarations?.includes(declaration as ts.Declaration)
	}

	function inside(current: ts.Node): boolean {
		if (
			current.getSourceFile() !== source ||
			current.pos < classOwner.members.pos ||
			current.end > classOwner.members.end
		) {
			return false
		}

		for (let parent = current.parent; parent && parent !== owner; parent = parent.parent) {
			if (ts.isClassLike(parent)) {
				return false
			}
		}

		return true
	}

	function couldBeTarget(expression: ts.Node): boolean {
		const type = checker.getTypeAtLocation(expression)

		if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
			return true
		}

		return (
			sameSymbol(checker.getPropertyOfType(type, name)) ||
			(type.isUnionOrIntersection() && type.types.some(part => sameSymbol(checker.getPropertyOfType(part, name))))
		)
	}

	function visit(current: ts.Node): void {
		if (unsafe) {
			return
		}

		if (ts.isElementAccessExpression(current) && couldBeTarget(current.expression)) {
			const argument = current.argumentExpression

			if (!ts.isStringLiteralLike(argument) || argument.text === name) {
				unsafe = true
			}
		}

		if (ts.isPropertyAccessExpression(current) && current.name.text === name) {
			const resolved = checker.getSymbolAtLocation(current.name)

			if (sameSymbol(resolved)) {
				if (
					!inside(current) ||
					current.flags & ts.NodeFlags.OptionalChain ||
					current.expression.kind === ts.SyntaxKind.SuperKeyword ||
					(ts.isPropertyAccessExpression(current.expression) &&
						current.expression.name.text === 'prototype') ||
					(isStatic &&
						(!ts.isIdentifier(current.expression) ||
							!classSymbol ||
							checker.getSymbolAtLocation(current.expression) !== classSymbol))
				) {
					unsafe = true
				} else {
					replacements.push(current.name)
				}
			} else if (couldBeTarget(current.expression)) {
				unsafe = true
			}
		} else if (
			current !== key &&
			current.parent &&
			!(ts.isPropertyAccessExpression(current.parent) && current.parent.name === current) &&
			sameSymbol(checker.getSymbolAtLocation(current))
		) {
			unsafe = true
		}

		// Reflection, spreading and destructuring can observe ordinary properties.
		if (
			(ts.isCallExpression(current) || ts.isNewExpression(current)) &&
			current.arguments?.some(argument => couldBeTarget(argument))
		) {
			unsafe = true
		}

		if ((ts.isSpreadAssignment(current) || ts.isSpreadElement(current)) && couldBeTarget(current.expression)) {
			unsafe = true
		}

		if (
			ts.isBinaryExpression(current) &&
			current.operatorToken.kind === ts.SyntaxKind.InKeyword &&
			couldBeTarget(current.right)
		) {
			unsafe = true
		}

		if (
			ts.isBinaryExpression(current) &&
			ts.isObjectLiteralExpression(current.left) &&
			couldBeTarget(current.right)
		) {
			unsafe = true
		}

		if (ts.isObjectBindingPattern(current) && couldBeTarget(current)) {
			unsafe = true
		}

		if (
			ts.isVariableDeclaration(current) &&
			ts.isObjectBindingPattern(current.name) &&
			current.initializer &&
			couldBeTarget(current.initializer)
		) {
			unsafe = true
		}

		if (
			ts.isDeleteExpression(current) &&
			ts.isPropertyAccessExpression(current.expression) &&
			sameSymbol(checker.getSymbolAtLocation(current.expression.name))
		) {
			unsafe = true
		}

		ts.forEachChild(current, visit)
	}

	for (const file of services.program.getSourceFiles()) {
		if (!file.isDeclarationFile && !services.program.isSourceFileFromExternalLibrary(file)) {
			visit(file)
		}

		if (unsafe) {
			return
		}
	}

	const token = context.sourceCode.getFirstToken(node, { filter: token => token.value === 'private' })

	if (!token) {
		return
	}

	return fixer => [
		fixer.removeRange([
			token.range[0],
			token.range[1] + (/^\s/.test(context.sourceCode.text.slice(token.range[1])) ? 1 : 0),
		]),
		...replacements.map(reference =>
			fixer.replaceTextRange([reference.getStart(source), reference.end], `#${name}`),
		),
	]
}
