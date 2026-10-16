import plugin = require('../../dist')
import { TSESLint } from '@typescript-eslint/utils'

const config: TSESLint.FlatConfig.Config = {
	plugins: { 'enforce-es-private': plugin },
	rules: {
		'enforce-es-private/fields': 'error',
		'enforce-es-private/methods': 'warn',
		'enforce-es-private/getters': 'off',
	},
}

const recommended: TSESLint.FlatConfig.Config = plugin.configs.recommended
const typed: TSESLint.FlatConfig.Config = plugin.configs['recommended-type-checked']
const legacy: TSESLint.ClassicConfig.Config = plugin.configs['legacy-recommended']
const name: string = plugin.meta.name

// @ts-expect-error The removed rule must also be absent from the public types.
plugin.rules['underscore-prefix']

// @ts-expect-error Flat presets are objects, not arrays.
const oldConfigArray: TSESLint.FlatConfig.Config[] = plugin.configs.recommended

export { config, recommended, typed, legacy, name, oldConfigArray }
