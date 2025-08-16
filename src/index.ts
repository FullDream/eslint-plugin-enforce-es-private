import { rules } from './rules'
import { FlatConfig } from '@typescript-eslint/utils/ts-eslint'


type RulesType = Record<`enforce-es-private/${keyof typeof rules}`, FlatConfig.RuleLevel>

const { name, version } =
	// `import`ing here would bypass the TSConfig's `"rootDir": "src"`
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('../package.json') as typeof import('../package.json')

const recommendedRules: RulesType = {
	'enforce-es-private/typescript-private': 'error',
	'enforce-es-private/underscore-prefix': 'error',
}

const plugin = {
	meta: { name, version },
	rules,
	configs: {
		get recommended() {
			return recommended
		},
		'legacy-recommended': {
			plugins: ['enforce-es-private'],
			rules: recommendedRules,
		},
	},
}

const recommended = [
	{
		plugins: { 'enforce-es-private': plugin },
		rules: recommendedRules,
	},
] as const


module.exports = plugin;
