# typescript-private

Prefer ECMAScript private members (`#name`) over TypeScript's `private` modifier.
This rule is enabled by all recommended configurations.
For flat config, use `[plugin.configs.recommended]` for diagnostics or
`[plugin.configs['recommended-type-checked']]` to enable Project Service and safe
autofix in a TypeScript project. Both presets include the parser and file patterns.

```ts
// Before
class Counter {
	private value = 0
	private increment() {
		this.value++
	}
	run() {
		this.increment()
	}
}

// After
class Counter {
	#value = 0
	#increment() {
		this.#value++
	}
	run() {
		this.#increment()
	}
}
```

Public and protected members, `_prefixed` public members, and existing `#members`
are allowed. Existing spelling is preserved: `private _value` becomes `#_value`.
Methods, accessors, parameter properties, quoted and computed private declarations
are reported, but some require manual migration. A private constructor controls
instantiation and has no `#constructor` equivalent; retain it with a local rule
disable or exclude `constructors` when that restriction is intentional.

## Options

Use `members` to choose which kinds of TypeScript `private` declarations are
reported. The list replaces the default selection; unlisted kinds are ignored.

```javascript
'enforce-es-private/typescript-private': ['error', {
  members: ['fields', 'methods'],
}]
```

| Member kind           | Includes                                                                         |
| --------------------- | -------------------------------------------------------------------------------- |
| `fields`              | Class fields, including quoted/computed declarations and readonly fields         |
| `methods`             | Regular, async and generator methods; excludes getters, setters and constructors |
| `getters`             | `get` accessors                                                                  |
| `setters`             | `set` accessors                                                                  |
| `autoAccessors`       | `accessor` declarations                                                          |
| `parameterProperties` | Constructor parameter properties such as `constructor(private value: number)`    |
| `constructors`        | Private constructors; reported without autofix because `#constructor` is invalid |

Omitting the options object or `members` enables all seven kinds, preserving the
default behavior. `members: []` disables all checks. The same selection applies
to static and instance members. Public, protected and native private members are
still ignored.

Selection controls diagnostics and which declarations may be fixed. It does not
relax autofix safety checks. A field's references are still updated inside an
excluded method when that field is fixed. A getter/setter pair still receives no
autofix, even when only one half is selected, because partial conversion would
change the property behavior.

## Autofix

Diagnostics work without type information. Fixes require a TypeScript program
(`parserOptions.projectService`, `project`, or `programs`). Only the declaration
and dot accesses resolved to the same TypeScript symbol are renamed. Local
variables and unrelated properties with the same spelling are preserved.

The rule leaves the diagnostic without a fix when it encounters ambiguous or
unsupported uses, including:

-   External references in any source file in the current TypeScript program.
-   Bracket access such as `this['value']`, `other['value']`, and dynamic keys.
-   Unresolved or `any` receivers, optional chains, `super`, or a reference from a
    nested class where native private name lookup may differ.
-   Destructuring, object spread, deletion, the `in` operator, or passing an instance
    to a call that could inspect its properties (including reflection APIs).
-   Native private name collisions, getter/setter pairs, overloads, decorators,
    parameter properties, auto-accessors, ambient/declared members, or overrides.
-   Static access through `this`, whose receiver can be a derived constructor.
-   A TypeScript compilation target below ES2015, which cannot compile `#members`.

Review migrations: native privacy intentionally changes runtime behavior.
Private members disappear from ordinary property enumeration and serialization,
and cannot be accessed through strings, proxies, or structurally similar objects.
Analysis is limited to the current TypeScript program. Consumers in other
projects, runtime reflection, and aliases hidden behind untyped code cannot be
fully established by this rule. Do not use autofix as proof that an exported
class has no external consumers.

Use an ES2015 or newer TypeScript target for native private fields (TypeScript
can downlevel them); choose ES2022 or newer to preserve native fields in output.
