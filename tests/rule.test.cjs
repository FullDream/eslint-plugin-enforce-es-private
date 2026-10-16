const assert = require('node:assert/strict')
const { test } = require('node:test')
const path = require('node:path')
const ts = require('typescript')
const parser = require('@typescript-eslint/parser')
const { Linter } = require('eslint')
const plugin = require('../dist')

const filename = path.resolve(__dirname, 'input.ts')
const normalize = file => path.resolve(file).replaceAll('\\', '/').toLowerCase()

function lint(code, { typed = true, others = {}, target = ts.ScriptTarget.ES2022, ruleOptions = [] } = {}) {
	const files = new Map([
		[filename, code],
		...Object.entries(others).map(([name, text]) => [path.resolve(__dirname, name), text]),
	])
	const options = {
		target,
		module: ts.ModuleKind.CommonJS,
		strict: true,
		noLib: true,
		types: [],
	}
	const host = ts.createCompilerHost(options)
	const virtualFiles = new Map([...files].map(([file, text]) => [normalize(file), text]))
	const fileExists = host.fileExists.bind(host)

	host.fileExists = file => virtualFiles.has(normalize(file)) || fileExists(file)

	const originalGetSourceFile = host.getSourceFile.bind(host)

	host.getSourceFile = (file, languageVersion, ...rest) =>
		virtualFiles.has(normalize(file))
			? ts.createSourceFile(file, virtualFiles.get(normalize(file)), languageVersion, true)
			: originalGetSourceFile(file, languageVersion, ...rest)

	const program = ts.createProgram([...files.keys()], options, host)
	const config = [
		{
			files: ['**/*.ts'],
			languageOptions: { parser, parserOptions: typed ? { programs: [program] } : {} },
			plugins: { 'enforce-es-private': plugin },
			rules: { 'enforce-es-private/typescript-private': ['error', ...ruleOptions] },
		},
	]
	const messages = new Linter({ configType: 'flat' }).verify(code, config, { filename })

	assert.ok(!messages.some(message => message.fatal), JSON.stringify(messages))

	return { messages, config }
}

function fixed(code, expected, options) {
	const { messages } = lint(code, options)

	assert.ok(messages.length)
	assert.ok(
		messages.every(message => message.fix),
		JSON.stringify(messages),
	)

	const edits = messages.flatMap(message => [message.fix]).sort((a, b) => b.range[0] - a.range[0])
	let output = code

	for (const edit of edits) {
		output = output.slice(0, edit.range[0]) + edit.text + output.slice(edit.range[1])
	}

	assert.equal(output, expected)
	assert.equal(lint(output, options).messages.length, 0, 'fixed code must parse and have no remaining diagnostics')
}

function unchanged(code, options) {
	const { messages } = lint(code, options)

	assert.ok(messages.length, 'must still report private members')
	assert.ok(
		messages.every(message => !message.fix),
		JSON.stringify(messages),
	)
}

test('public, protected, underscores and native private members are allowed', () => {
	assert.deepEqual(lint('class C { _value = 1; protected value = 2; #secret = 3; _method() {} }').messages, [])
})

for (const [title, code, expected] of [
	[
		'field',
		'class C { private value = 1; read() { return this.value } }',
		'class C { #value = 1; read() { return this.#value } }',
	],
	[
		'method',
		'class C { private value() {} read() { this.value() } }',
		'class C { #value() {} read() { this.#value() } }',
	],
	[
		'underscore preserved',
		'class C { private _value = 1; read() { return this._value } }',
		'class C { #_value = 1; read() { return this.#_value } }',
	],
	[
		'locals and unrelated objects',
		'const value = 0; class C { private value = 1; read() { const value = 2; const o = { value }; return [this.value, o.value, value] } }',
		'const value = 0; class C { #value = 1; read() { const value = 2; const o = { value }; return [this.#value, o.value, value] } }',
	],
	[
		'arrow and alias',
		'class C { private value = 1; read() { const self = this; return () => self.value } }',
		'class C { #value = 1; read() { const self = this; return () => self.#value } }',
	],
	[
		'other instance inside class',
		'class C { private value = 1; read(other: C) { return other.value } }',
		'class C { #value = 1; read(other: C) { return other.#value } }',
	],
	[
		'static through declaring class',
		'class C { private static value = 1; static read() { return C.value } }',
		'class C { static #value = 1; static read() { return C.#value } }',
	],
	[
		'readonly and comments',
		'class C { private /* keep */ readonly value!: number; read() { return this.value } }',
		'class C { /* keep */ readonly #value!: number; read() { return this.#value } }',
	],
	[
		'nested class unrelated member',
		'class C { private value = 1; read() { class D { value = 2; read() { return this.value } } return this.value } }',
		'class C { #value = 1; read() { class D { value = 2; read() { return this.value } } return this.#value } }',
	],
	[
		'writes',
		'class C { private value = 1; read() { this.value++; this.value += 2; return this.value } }',
		'class C { #value = 1; read() { this.#value++; this.#value += 2; return this.#value } }',
	],
	[
		'generic receiver',
		'class C { private value = 1; read<T extends C>(other: T) { return other.value } }',
		'class C { #value = 1; read<T extends C>(other: T) { return other.#value } }',
	],
	[
		'getter',
		'class C { private get value() { return 1 } read() { return this.value } }',
		'class C { get #value() { return 1 } read() { return this.#value } }',
	],
	[
		'setter',
		'class C { private set value(v: number) {} read() { this.value = 2 } }',
		'class C { set #value(v: number) {} read() { this.#value = 2 } }',
	],
	[
		'async generator',
		'class C { private async *value() { yield 1 } read() { return this.value() } }',
		'class C { async *#value() { yield 1 } read() { return this.#value() } }',
	],
	[
		'unrelated string property',
		"const o = { value: 2 }; o['value']; class C { private value = 1; read() { return this.value } }",
		"const o = { value: 2 }; o['value']; class C { #value = 1; read() { return this.#value } }",
	],
	[
		'class expression',
		'const C = class { private value = 1; read() { return this.value } }',
		'const C = class { #value = 1; read() { return this.#value } }',
	],
]) {
	test(`fix: ${title}`, () => fixed(code, expected))
}

for (const [title, code] of [
	['external dot', 'class C { private value = 1 } new C().value'],
	['external string', "class C { private value = 1 } new C()['value']"],
	['internal string', "class C { private value = 1; read() { return this['value'] } }"],
	['escaped string', "class C { private value = 1; read() { return this['val\\u0075e'] } }"],
	['template key', 'class C { private value = 1; read() { return this[`value`] } }'],
	['dynamic key', 'class C { private value = 1; read(key: string) { return this[key] } }'],
	['constant key', "const key = 'value' as const; class C { private value = 1; read() { return this[key] } }"],
	['cast any', 'class C { private value = 1; read() { return (this as any).value } }'],
	['optional access', 'class C { private value = 1; read(other?: C) { return other?.value } }'],
	['destructure', 'class C { private value = 1; read() { const { value } = this; return value } }'],
	['spread', 'class C { private value = 1; read() { return { ...this } } }'],
	['reflection', "class C { private value = 1; read() { return Reflect.get(this, 'value') } }"],
	['in operator', "class C { private value = 1; read() { return 'value' in this } }"],
	['delete', 'class C { private value = 1; read() { delete this.value } }'],
	['private collision', 'class C { private value = 1; #value = 2 }'],
	['accessor pair', 'class C { private get value() { return 1 } private set value(v: number) {} }'],
	['overload', 'class C { private value(x: number): number; private value(x: number) { return x } }'],
	['parameter property', 'class C { constructor(private value: number) {} }'],
	['quoted declaration', "class C { private 'value' = 1 }"],
	['computed declaration', "class C { private ['value'] = 1 }"],
	['ambient field', 'declare class C { private value: number }'],
	['declared field', 'class C { declare private value: number }'],
	['decorator', 'class C { @decorate private value = 1 }'],
	['static inherited receiver', 'class C { private static value = 1; static read() { return this.value } }'],
	['private constructor', 'class C { private constructor() {} }'],
	['class prototype', 'class C { private value = 1; read() { return C.prototype.value } }'],
	[
		'static derived constructor',
		'class C { private static value = 1; static read() { class D extends C {} return D.value } }',
	],
	[
		'nested private name shadowing',
		'class C { private value = 1; read() { const outer = this; return class D { #value = 2; read() { return outer.value } } } }',
	],
	['external any string', "class C { private value = 1 } (new C() as any)['value']"],
	['optional string', "class C { private value = 1; read(other?: C) { return other?.['value'] } }"],
	['union receiver', 'class C { private value = 1; read(other: C | {value: number}) { return other.value } }'],
	['indexed access type', "class C { private value = 1; read(other: C['value']) {} }"],
	['typeof member', 'class C { private value = 1; read(): typeof this.value { return this.value } }'],
	[
		'destructuring assignment',
		'class C { private value = 1; read() { let value; ({ value } = this); return value } }',
	],
	['destructured parameter', 'class C { private value = 1; read({ value }: C) { return value } }'],
	['for of destructuring', 'class C { private value = 1; read() { for (const { value } of [this]) {} } }'],
	['numeric dynamic access', 'class C { private value = 1; read(key: number) { return this[key] } }'],
]) {
	test(`no fix: ${title}`, () => unchanged(code))
}

test('no fix: auto-accessor', { skip: Number.parseFloat(ts.versionMajorMinor) < 4.9 }, () => {
	unchanged('class C { private accessor value = 1 }')
})

test('without type information reports only', () => unchanged('class C { private value = 1 }', { typed: false }))
test('external reference in another program file blocks the fix', () => {
	unchanged('class C { private value = 1 }', { others: { 'external.ts': "new C()['value']" } })
})

test('imported class string access in another file blocks the fix', () => {
	unchanged('export class C { private value = 1 }', {
		others: { 'external.ts': "import { C } from './input'; new C()['value']" },
	})
})

test('imported class dot access in another file blocks the fix', () => {
	unchanged('export class C { private value = 1 }', {
		others: { 'external.ts': "import { C } from './input'; new C().value" },
	})
})
test('only the remaining rule is exported and recommended', () => {
	assert.deepEqual(Object.keys(plugin.rules), ['typescript-private'])
	assert.deepEqual(plugin.configs.recommended.rules, { 'enforce-es-private/typescript-private': 'error' })
	assert.deepEqual(plugin.configs['legacy-recommended'].rules, plugin.configs.recommended.rules)
	assert.deepEqual(plugin.configs['recommended-type-checked'].rules, plugin.configs.recommended.rules)
	assert.equal(plugin.meta.version, '2.0.0')
})

test('method diagnostic uses the method message', () => {
	assert.equal(lint('class C { private value() {} }').messages[0].messageId, 'enforceEsPrivateMethod')
})

test('ES5 target blocks fixes that TypeScript cannot compile', () => {
	unchanged('class C { private value = 1 }', { target: ts.ScriptTarget.ES5 })
})

const memberCases = [
	['fields', 'class C { private value = 1 }'],
	['methods', 'class C { private value() {} }'],
	['getters', 'class C { private get value() { return 1 } }'],
	['setters', 'class C { private set value(v: number) {} }'],
	['autoAccessors', 'class C { private accessor value = 1 }'],
	['parameterProperties', 'class C { constructor(private value: number) {} }'],
	['constructors', 'class C { private constructor() {} }'],
]

for (const [member, code] of memberCases) {
	test(
		`members selects ${member} independently`,
		{ skip: member === 'autoAccessors' && Number.parseFloat(ts.versionMajorMinor) < 4.9 },
		() => {
			for (const [selected] of memberCases) {
				const { messages } = lint(code, { typed: false, ruleOptions: [{ members: [selected] }] })

				assert.equal(
					messages.length,
					selected === member ? 1 : 0,
					`${selected} must select only its own category`,
				)
			}

			assert.equal(
				lint(code, { typed: false, ruleOptions: [{}] }).messages.length,
				1,
				'omitted members must retain default checks',
			)
			assert.deepEqual(
				lint(code, { ruleOptions: [{ members: [] }] }).messages,
				[],
				'empty members must disable every category',
			)
		},
	)
}

test('members can combine fields and methods without checking accessors', () => {
	const { messages } = lint(
		'class C { private x = 1; private run() {} private get value() { return 2 } private set value(v: number) {} }',
		{
			ruleOptions: [{ members: ['fields', 'methods'] }],
		},
	)

	assert.deepEqual(
		messages.map(message => message.messageId),
		['enforceEsPrivateField', 'enforceEsPrivateMethod'],
	)
})

test('fixing a selected field updates its references inside an excluded private method', () => {
	fixed(
		'class C { private value = 1; private read() { return this.value } }',
		'class C { #value = 1; private read() { return this.#value } }',
		{ ruleOptions: [{ members: ['fields'] }] },
	)
})

for (const member of ['getters', 'setters']) {
	test(`selecting only ${member} does not partially fix a getter/setter pair`, () => {
		const { messages } = lint('class C { private get value() { return 1 } private set value(v: number) {} }', {
			ruleOptions: [{ members: [member] }],
		})

		assert.equal(messages.length, 1)
		assert.equal(messages[0].fix, undefined)
	})
}

test('members applies equally to static members', () => {
	const { messages } = lint(
		'class C { private static x = 1; private static run() {} private static get value() { return 2 } }',
		{
			ruleOptions: [{ members: ['methods'] }],
		},
	)

	assert.equal(messages.length, 1)
	assert.equal(messages[0].messageId, 'enforceEsPrivateMethod')
})

for (const invalidOptions of [
	{ members: ['unknown'] },
	{ members: ['fields', 'fields'] },
	{ members: 'fields' },
	{ members: [true] },
	{ members: null },
	{ member: ['fields'] },
]) {
	test(`schema rejects invalid options ${JSON.stringify(invalidOptions)}`, () => {
		assert.throws(
			() => lint('class C {}', { ruleOptions: [invalidOptions] }),
			/enforce-es-private\/typescript-private/,
		)
	})
}
