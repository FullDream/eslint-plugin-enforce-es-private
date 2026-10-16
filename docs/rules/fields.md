# fields

Prefer native ECMAScript private fields over TypeScript `private` declarations.
Enabled at `error` by the recommended flat and legacy presets.

```ts
// Before
class C {
	private value = 1
}

// After
class C {
	#value = 1
}
```

Includes readonly, instance and static fields. Constructor parameter properties are ignored.

## Configuration

This rule has no options. Set its severity independently:

```javascript
'enforce-es-private/fields': 'warn' // 'error', 'warn', or 'off'
```

Diagnostics work without type information. Any automatic fix requires a
TypeScript program and the shared [autofix safety checks](typescript-private.md#autofix).
Do not enable the aggregate `typescript-private` rule for the same member kinds
alongside this rule, as that would duplicate diagnostics.
