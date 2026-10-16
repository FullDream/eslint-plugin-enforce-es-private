# auto-accessors

Prefer native ECMAScript private auto-accessors over TypeScript `private` declarations.
Enabled at `error` by the recommended flat and legacy presets.

```ts
// Before
class C {
	private accessor value = 1
}

// After
class C {
	accessor #value = 1
}
```

Requires TypeScript 4.9 or newer. Auto-accessors are reported without autofix and require manual migration.

## Configuration

This rule has no options. Set its severity independently:

```javascript
'enforce-es-private/auto-accessors': 'warn' // 'error', 'warn', or 'off'
```

Diagnostics work without type information. Any automatic fix requires a
TypeScript program and the shared [autofix safety checks](typescript-private.md#autofix).
Do not enable the aggregate `typescript-private` rule for the same member kinds
alongside this rule, as that would duplicate diagnostics.
