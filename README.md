# eslint-plugin-enforce-es-private

Prefer native ECMAScript private fields and methods (`#name`) over TypeScript's
`private` modifier. Native privacy is enforced at runtime.

The recommended configuration enables separate rules for fields, methods,
getters, setters and auto-accessors. Each supports its own ESLint severity.
The rules report without type information and offer conservative, symbol-aware fixes
when a TypeScript program is available.

## Compatibility

| Dependency                  | Supported versions                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------ |
| ESLint                      | `^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0`                                                   |
| `@typescript-eslint/parser` | `^8.0.0` (use a release that supports your ESLint version)                           |
| TypeScript                  | `>=4.8.4 <6.1.0`                                                                     |
| Node.js                     | `^18.18.0 \|\| ^20.9.0 \|\| >=21.1.0`, subject to your ESLint version's requirements |

ESLint 10 requires Node.js `^20.19.0 || ^22.13.0 || >=24` and
typescript-eslint 8.57.2 or newer. ESLint 8.57 is the lowest version supported by
the plugin's typescript-eslint dependency. Legacy `.eslintrc` configuration is
available with ESLint 8 and 9; use flat config with ESLint 10.

## Installation

If your project already has compatible versions of ESLint, TypeScript and
`@typescript-eslint/parser`, install the plugin:

```bash
npm install --save-dev eslint-plugin-enforce-es-private
```

When setting up ESLint for TypeScript from scratch, install the plugin and its
required peer dependencies:

```bash
npm install --save-dev eslint typescript @typescript-eslint/parser eslint-plugin-enforce-es-private
```

The recommended flat configs configure `@typescript-eslint/parser` automatically;
you do not need to import it in your ESLint config. The parser must still be
available as a dependency. See [Compatibility](#compatibility) for supported versions.

## Usage: flat config

Use the ready-to-use recommended config. It registers the TypeScript parser and
plugin, enables the member rules, and applies to `.ts`, `.tsx`, `.mts` and `.cts` files:

```javascript
// eslint.config.mjs
import enforceEsPrivate from 'eslint-plugin-enforce-es-private'

export default [enforceEsPrivate.configs.recommended]
```

For a TypeScript project with a `tsconfig.json`, enable type-aware autofix with
the typed preset:

```javascript
// eslint.config.mjs
import enforceEsPrivate from 'eslint-plugin-enforce-es-private'

export default [enforceEsPrivate.configs['recommended-type-checked']]
```

| Flat preset                | Type information                                             | Behavior                                                              |
| -------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `recommended`              | Uses your existing parser options; does not enable a project | Reports diagnostics; fixes when type information is already available |
| `recommended-type-checked` | Enables `parserOptions.projectService: true`                 | Reports diagnostics and offers safe fixes                             |

The typed preset requires linted TypeScript files to belong to a `tsconfig.json`.
For standalone files without a TypeScript project, use `recommended`.
Both presets configure the same rules; choose one.

Each flat preset is a named configuration object, following
[ESLint's plugin configuration format](https://eslint.org/docs/latest/extend/plugins#configs-in-plugins).
Insert it directly into your config array, without `[0]` or array spreading.
This works on every supported ESLint version; newer ESLint versions can also
accept these objects through `defineConfig` from `eslint/config`.

To restrict the files or override a rule, spread the config object:

```javascript
export default [
	{
		...enforceEsPrivate.configs.recommended,
		files: ['src/**/*.ts'],
		rules: {
			...enforceEsPrivate.configs.recommended.rules,
			'enforce-es-private/fields': 'warn',
		},
	},
]
```

TypeScript ESLint configurations can be used alongside these presets. If your
existing configuration enables type information, `recommended` uses it too.
When using `parserOptions.project` with the typed preset, explicitly set
`projectService: false`; do not enable both project mechanisms at once.

To select rules manually, configure the TypeScript parser, register the plugin
as `enforce-es-private`, and enable the desired member rules.

## Per-member severity

Set each member rule to `error`, `warn` or `off` using
[standard ESLint rule severities](https://eslint.org/docs/latest/use/configure/rules#rule-severities).
For example, require native private fields, warn about methods and setters, and
allow TypeScript-private getters and auto-accessors:

```javascript
import enforceEsPrivate from 'eslint-plugin-enforce-es-private'

export default [
	{
		...enforceEsPrivate.configs['recommended-type-checked'],
		rules: {
			...enforceEsPrivate.configs['recommended-type-checked'].rules,
			'enforce-es-private/fields': 'error',
			'enforce-es-private/methods': 'warn',
			'enforce-es-private/getters': 'off',
			'enforce-es-private/setters': 'warn',
			'enforce-es-private/auto-accessors': 'off',
		},
	},
]
```

| Rule                                             | Checked declarations                                           |
| ------------------------------------------------ | -------------------------------------------------------------- |
| [`fields`](docs/rules/fields.md)                 | Instance/static fields, including readonly fields              |
| [`methods`](docs/rules/methods.md)               | Instance/static methods, including async and generator methods |
| [`getters`](docs/rules/getters.md)               | Instance/static `get` accessors                                |
| [`setters`](docs/rules/setters.md)               | Instance/static `set` accessors                                |
| [`auto-accessors`](docs/rules/auto-accessors.md) | `accessor` declarations                                        |

All five rules default to `error` in the recommended presets and accept no
options. Numeric severities `2`, `1` and `0` also work. For diagnostics without a
TypeScript project, use `configs.recommended` with the same severity overrides.

Constructors and constructor parameter properties such as
`constructor(private api: Api)` are ignored: neither has a direct `#` equivalent.
They retain their TypeScript syntax without diagnostics or autofix.

Getter/setter pairs still require manual migration, including when only one half
is enabled. All member rules share the same
[autofix safety checks](docs/rules/typescript-private.md#autofix).

The aggregate [`typescript-private`](docs/rules/typescript-private.md) rule remains
available for existing manual configurations, including its `members` option
(`fields`, `methods`, `getters`, `setters`, `autoAccessors`). It applies one severity
to every selected kind. Recommended presets disable it to prevent duplicate
diagnostics. Avoid enabling it alongside the independent member rules.

## Usage: legacy config (ESLint 8/9)

```json
{
	"parser": "@typescript-eslint/parser",
	"parserOptions": { "project": true },
	"extends": ["plugin:enforce-es-private/legacy-recommended"]
}
```

ESLint 9 requires `ESLINT_USE_FLAT_CONFIG=false` to load `.eslintrc` files.

## Autofix

```ts
// Before
class Counter {
	private value = 0
	increment() {
		this.value++
	}
}

// After eslint --fix
class Counter {
	#value = 0
	increment() {
		this.#value++
	}
}
```

Fixes preserve spelling (`private _value` → `#_value`) and only rename accesses
resolved to the same TypeScript symbol. String or dynamic access such as
`object['value']` blocks the fix; the property and its accesses remain unchanged
for manual migration. External references in the current TypeScript program,
reflection, ambiguous receivers, overloads, decorators, and other unsafe cases
also block fixes. See the [rule documentation](docs/rules/typescript-private.md)
for details and analysis limits.

Changing to `#` intentionally changes runtime behavior, including enumeration,
serialization and access through proxies. Review fixes, particularly for public
library classes consumed outside the current TypeScript program.

## Migrating from v1: underscore-prefix removed

Version 2 removes `enforce-es-private/underscore-prefix` from the plugin and the
recommended configurations. Remove explicit references to that rule. Public
`_name` members no longer trigger diagnostics or conversion to native privacy.

To discourage underscore naming with the standard TypeScript ESLint rule, install
`@typescript-eslint/eslint-plugin` and use
[`@typescript-eslint/naming-convention`](https://typescript-eslint.io/rules/naming-convention/):

```javascript
import tsPlugin from '@typescript-eslint/eslint-plugin'

// Add this object to the flat config array:
const namingConfig = {
	plugins: { '@typescript-eslint': tsPlugin },
	rules: {
		'@typescript-eslint/naming-convention': [
			'error',
			{
				selector: ['classProperty', 'classMethod', 'classicAccessor'],
				format: null,
				leadingUnderscore: 'forbid',
			},
		],
	},
}
```

This reports leading underscores; it does not convert members to `#private` or
autofix names. For an ESLint core alternative, use
[`no-underscore-dangle`](https://eslint.org/docs/latest/rules/no-underscore-dangle)
with `enforceInClassFields: true` and `enforceInMethodNames: true` (it also checks
other identifiers):

```javascript
rules: {
  'no-underscore-dangle': ['error', {
    enforceInClassFields: true,
    enforceInMethodNames: true,
  }],
}
```

Explicitly declare a member `private` to apply this plugin's
native privacy rule. Neither naming rule is a semantic replacement for the old
underscore conversion.

Other v2 changes: fixes require type information, leading underscores are
preserved, and Node.js minimum versions now match typescript-eslint. See the
[changelog](CHANGELOG.md) and [v2 release notes](releases/v2.0.0.md).

## Breaking change: flat preset API in v2

`configs.recommended` is now an object instead of a one-element array, and
includes the TypeScript parser and file patterns. Update existing flat configs:

```javascript
// Before
export default [...enforceEsPrivate.configs.recommended]

// After
export default [enforceEsPrivate.configs.recommended]
```

Replace `...enforceEsPrivate.configs.recommended[0]` inside an object with
`...enforceEsPrivate.configs.recommended`. To enable type-aware autofix without
manually setting parser options, use `configs['recommended-type-checked']`.
Custom file patterns can be supplied with an object spread. The
`legacy-recommended` configuration retains its `.eslintrc` format and uses the
same independent member rules as the flat presets.

Recommended presets now enable `fields`, `methods`, `getters`, `setters` and
`auto-accessors` individually and disable `typescript-private`. Replace overrides
of the aggregate rule with overrides of the member rules, using the examples in
[Per-member severity](#per-member-severity). Existing manual configurations can
continue using `typescript-private` on its own.
