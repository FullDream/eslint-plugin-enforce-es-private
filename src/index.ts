import { rules } from './rules'

type RulesType = Record<`enforce-es-private/${keyof typeof rules}`, 'error' | 'warn' | 'off'>

const { name, version } =
	// `import`ing here would bypass the TSConfig's `"rootDir": "src"`
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('../package.json') as typeof import('../package.json')

const plugin = {
	configs: {},
	meta: { name, version },
	rules,
}

Object.assign(plugin.configs, {
	recommended: {
		plugins: {
			'enforce-es-private': plugin,
		},
		rules: {
			'enforce-es-private/typescript-private': 'error',
			'enforce-es-private/underscore-prefix': 'error'

		} as RulesType,
	},
})

module.exports = plugin
