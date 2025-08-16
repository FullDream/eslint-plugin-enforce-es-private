// @ts-check

import eslint from '@eslint/js'
import tsEslint from 'typescript-eslint'
import eslintPlugin from 'eslint-plugin-eslint-plugin'

export default tsEslint.config(
	eslint.configs.recommended,
	eslintPlugin.configs.recommended,
	...tsEslint.configs.recommended,
)
