# eslint-plugin-enforce-es-private

ESLint rules that encourage native ECMAScript private fields and methods (#) instead of TypeScript’s private modifier or
underscore-named “private”s.

* ✅ Auto-fixable (with safety checks)
* 🔍 Type-aware (uses type information to catch external references)
* 🧩 Works with Flat Config and legacy .eslintrc

## Why?

* Native # privacy is enforced at runtime and by the engine (no accidental access).
* Consistent semantics between JS and TS.
* Clearer intent than naming conventions like _foo.

## Installation

```bash
npm install eslint-plugin-enforce-es-private --save-dev
```

## Usage (Flat Config)
```javascript
import eslint from '@eslint/js'
import tsEslint from 'typescript-eslint'
import enforceEsPrivate from 'eslint-plugin-enforce-es-private' // <- import

export default tsEslint.config(
	eslint.configs.recommended,
	...tsEslint.configs.recommended,
	...enforceEsPrivate.configs.recommended, // <- usage recommended config
)

```