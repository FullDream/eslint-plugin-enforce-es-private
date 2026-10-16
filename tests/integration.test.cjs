const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test } = require('node:test')
const { Linter } = require('eslint')
const parser = require('@typescript-eslint/parser')
const plugin = require('../dist')
const ts = require('typescript')

test('CommonJS declarations expose usable plugin and config types', () => {
	const program = ts.createProgram([path.join(__dirname, 'types/consumer.ts')], {
		strict: true,
		noEmit: true,
		skipLibCheck: true,
		target: ts.ScriptTarget.ES2022,
		module: ts.ModuleKind.CommonJS,
		esModuleInterop: true,
		types: [],
	})
	const diagnostics = ts.getPreEmitDiagnostics(program)

	assert.deepEqual(
		diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
		[],
	)
})

test('project-backed autofix handles overlapping edits and is idempotent', () => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'enforce-es-private-'))

	try {
		const filename = path.join(directory, 'input.ts')

		fs.writeFileSync(
			path.join(directory, 'tsconfig.json'),
			JSON.stringify({ compilerOptions: { target: 'ES2022' }, include: ['*.ts'] }),
		)

		const code =
			'export class C { private x = 1; private y = 2; private sum() { return this.x + this.y } read() { return this.sum() } }'

		fs.writeFileSync(filename, code)

		const config = [plugin.configs['recommended-type-checked']]
		const linter = new Linter({ configType: 'flat', cwd: directory })
		const result = linter.verifyAndFix(code, config, { filename })

		assert.equal(
			result.output,
			'export class C { #x = 1; #y = 2; #sum() { return this.#x + this.#y } read() { return this.#sum() } }',
		)
		assert.deepEqual(result.messages, [])

		const second = linter.verifyAndFix(result.output, config, { filename })

		assert.equal(second.fixed, false)
		assert.equal(second.output, result.output)
	} finally {
		assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep))
		fs.rmSync(directory, { recursive: true, force: true })
	}
})

const major = Number(require('eslint/package.json').version.split('.')[0])

test('legacy recommended config loads on ESLint 8 and 9', { skip: major >= 10 }, () => {
	const linter = new Linter({ configType: 'eslintrc' })

	linter.defineParser('typescript', parser)

	for (const [name, rule] of Object.entries(plugin.rules)) {
		linter.defineRule(`enforce-es-private/${name}`, rule)
	}

	const messages = linter.verify('class C { private x = 1 }', {
		parser: 'typescript',
		rules: plugin.configs['legacy-recommended'].rules,
	})

	assert.equal(messages.length, 1)
	assert.equal(messages[0].ruleId, 'enforce-es-private/fields')
	assert.equal(messages[0].fix, undefined)
})

test('published entry point supports ESM default import', async () => {
	const { pathToFileURL } = require('node:url')
	const imported = await import(pathToFileURL(require.resolve('../dist')).href)

	assert.equal(imported.default, plugin)
})

for (const extension of ['ts', 'tsx', 'mts', 'cts']) {
	test(`recommended parses .${extension} without parser setup or a TypeScript project`, () => {
		const code = extension === 'tsx' ? 'class C { private x = <span /> }' : 'class C { private x = 1 }'
		const messages = new Linter({ configType: 'flat' }).verify(code, [plugin.configs.recommended], {
			filename: path.join(__dirname, `input.${extension}`),
		})

		assert.equal(messages.length, 1)
		assert.equal(messages[0].ruleId, 'enforce-es-private/fields')
		assert.equal(messages[0].fix, undefined)
	})
}

test('recommended does not register plugin rules for JavaScript files', () => {
	const messages = new Linter({ configType: 'flat' }).verify('class C { #x = 1 }', [plugin.configs.recommended], {
		filename: path.join(__dirname, 'input.js'),
	})

	assert.deepEqual(messages, [])
})

test('recommended supports mixed error, warning and off member rules without duplicates', () => {
	const code =
		'class C { private x = 1; private method() {} private get value() { return 1 } private set value(v: number) {} private constructor(private readonly api: number) {} }'
	const config = [
		plugin.configs.recommended,
		{
			rules: {
				'enforce-es-private/fields': 'error',
				'enforce-es-private/methods': 'warn',
				'enforce-es-private/getters': 'off',
				'enforce-es-private/setters': 'warn',
				'enforce-es-private/auto-accessors': 'off',
			},
		},
	]
	const messages = new Linter({ configType: 'flat' }).verify(code, config, {
		filename: path.join(__dirname, 'input.ts'),
	})

	assert.deepEqual(
		messages.map(({ ruleId, severity }) => ({ ruleId, severity })),
		[
			{ ruleId: 'enforce-es-private/fields', severity: 2 },
			{ ruleId: 'enforce-es-private/methods', severity: 1 },
			{ ruleId: 'enforce-es-private/setters', severity: 1 },
		],
	)
})

test('recommended rules can be overridden with a following config', () => {
	const messages = new Linter({ configType: 'flat' }).verify(
		'class C { private x = 1 }',
		[plugin.configs.recommended, { rules: { 'enforce-es-private/fields': 'off' } }],
		{ filename: path.join(__dirname, 'input.ts') },
	)

	assert.deepEqual(messages, [])
})

const minor = Number(require('eslint/package.json').version.split('.')[1])

test(
	'modern defineConfig resolves the named recommended preset through extends',
	{ skip: major < 9 || (major === 9 && minor < 22) },
	() => {
		const { defineConfig } = require('eslint/config')
		const config = defineConfig({
			plugins: { 'enforce-es-private': plugin },
			extends: ['enforce-es-private/recommended'],
		})
		const messages = new Linter({ configType: 'flat' }).verify('class C { private x = 1 }', config, {
			filename: path.join(__dirname, 'input.ts'),
		})

		assert.equal(messages.length, 1)
		assert.equal(messages[0].ruleId, 'enforce-es-private/fields')
	},
)
