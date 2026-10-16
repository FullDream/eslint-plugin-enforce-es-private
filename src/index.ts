import { rules } from './rules'
import { TSESLint } from '@typescript-eslint/utils'
import * as parser from '@typescript-eslint/parser'

type RulesType = Record<`enforce-es-private/${keyof typeof rules}`, TSESLint.FlatConfig.RuleLevel>

const { name, version } =
	// `import`ing here would bypass the TSConfig's `"rootDir": "src"`
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('../package.json') as typeof import('../package.json')

const recommendedRules: RulesType = {
	'enforce-es-private/typescript-private': 'error',
}

const plugin: {
	meta: { name: string; version: string }
	rules: typeof rules
	configs: {
		recommended: TSESLint.FlatConfig.Config
		'recommended-type-checked': TSESLint.FlatConfig.Config
		'legacy-recommended': TSESLint.ClassicConfig.Config
	}
} = {
	meta: { name, version },
	rules,
	configs: {
		get recommended() {
			return recommended
		},
		get 'recommended-type-checked'() {
			return recommendedTypeChecked
		},
		'legacy-recommended': {
			plugins: ['enforce-es-private'],
			rules: recommendedRules,
		},
	},
}

const recommended: TSESLint.FlatConfig.Config = {
	name: 'enforce-es-private/recommended',
	files: ['**/*.{ts,tsx,mts,cts}'],
	languageOptions: { parser },
	plugins: { 'enforce-es-private': plugin },
	rules: recommendedRules,
}

const recommendedTypeChecked: TSESLint.FlatConfig.Config = {
	...recommended,
	name: 'enforce-es-private/recommended-type-checked',
	languageOptions: { parser, parserOptions: { projectService: true } },
}

export = plugin
