# getters

Prefer native ECMAScript private getters over TypeScript `private` declarations.
Enabled at `error` by the recommended flat and legacy presets.

```ts
// Before
class C {
	private get value() {
		return 1
	}
}

// After
class C {
	get #value() {
		return 1
	}
}
```

Includes instance and static getters. Getter/setter pairs require manual migration; no partial autofix is offered.

## Configuration

This rule has no options. Set its severity independently:

```javascript
'enforce-es-private/getters': 'warn' // 'error', 'warn', or 'off'
```

Diagnostics work without type information. Any automatic fix requires a
TypeScript program and the shared [autofix safety checks](typescript-private.md#autofix).
Do not enable the aggregate `typescript-private` rule for the same member kinds
alongside this rule, as that would duplicate diagnostics.
