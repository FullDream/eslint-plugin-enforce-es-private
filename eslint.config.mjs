// @ts-check

import eslint from '@eslint/js'
import tsEslint from 'typescript-eslint'

const sourceFiles = ['src/**/*.ts']
const sourceIgnores = ['src/specs/**']

export default tsEslint.config(
	{ ignores: ['dist/**', 'node_modules/**', '.compat/**', '.idea/**'] },
	...[eslint.configs.recommended, ...tsEslint.configs.recommended].map(config => ({
		...config,
		files: sourceFiles,
		ignores: sourceIgnores,
	})),
	{
		files: ['**/*.{js,mjs,cjs,ts}'],
		languageOptions: { parser: tsEslint.parser },
		rules: {
			curly: ['error', 'all'],
			'padding-line-between-statements': [
				'error',
				{
					blankLine: 'always',
					prev: '*',
					next: ['return', 'block-like', 'if', 'for', 'while', 'switch', 'try', 'function', 'class'],
				},
				{
					blankLine: 'always',
					prev: ['block-like', 'if', 'for', 'while', 'switch', 'try', 'function', 'class'],
					next: '*',
				},
				{ blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
				{ blankLine: 'always', prev: '*', next: ['const', 'let', 'var'] },
				{ blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
			],
		},
	},
)
