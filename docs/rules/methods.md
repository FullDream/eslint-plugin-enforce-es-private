# methods

Prefer native ECMAScript private methods over TypeScript `private` declarations.
Enabled at `error` by the recommended flat and legacy presets.

```ts
// Before
class C {
	private async load() {
		return 1
	}
}

// After
class C {
	async #load() {
		return 1
	}
}
```

Includes instance/static, async and generator methods. Constructors are always ignored.

## Configuration

This rule has no options. Set its severity independently:

```javascript
'enforce-es-private/methods': 'warn' // 'error', 'warn', or 'off'
```

Diagnostics work without type information. Any automatic fix requires a
TypeScript program and the shared [autofix safety checks](typescript-private.md#autofix).
Do not enable the aggregate `typescript-private` rule for the same member kinds
alongside this rule, as that would duplicate diagnostics.
