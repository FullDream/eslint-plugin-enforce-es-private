# setters

Prefer native ECMAScript private setters over TypeScript `private` declarations.
Enabled at `error` by the recommended flat and legacy presets.

```ts
// Before
class C {
	private set value(v: number) {}
}

// After
class C {
	set #value(v: number) {}
}
```

Includes instance and static setters. Getter/setter pairs require manual migration; no partial autofix is offered.

## Configuration

This rule has no options. Set its severity independently:

```javascript
'enforce-es-private/setters': 'warn' // 'error', 'warn', or 'off'
```

Diagnostics work without type information. Any automatic fix requires a
TypeScript program and the shared [autofix safety checks](typescript-private.md#autofix).
Do not enable the aggregate `typescript-private` rule for the same member kinds
alongside this rule, as that would duplicate diagnostics.
