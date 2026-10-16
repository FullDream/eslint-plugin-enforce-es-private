# Changelog

## [2.0.0] - 2026-10-16

### BREAKING CHANGES

-   Recommended flat and legacy presets now enable `fields`, `methods`, `getters`,
    `setters` and `auto-accessors` as independent rules, each at `error`, and
    disable the aggregate `typescript-private` rule. Move preset severity
    overrides to the member rules. The aggregate rule remains available manually.
-   Change `configs.recommended` from a one-element array to a flat config object.
    Insert it directly (`[plugin.configs.recommended]`), remove array spreading
    and `[0]` indexing, and use object spread for overrides. The preset now
    registers the TypeScript parser and targets `.ts`, `.tsx`, `.mts` and `.cts`.
-   Remove `enforce-es-private/underscore-prefix` and its recommended configuration
    entries. Use `@typescript-eslint/naming-convention` or `no-underscore-dangle`
    for underscore naming restrictions; see the README migration guide.
-   Require a TypeScript program for autofix. Diagnostics still work without one.
-   Preserve leading underscores: `private _value` becomes `#_value`, not `#value`.
-   Align Node.js requirements with typescript-eslint: `^18.18.0 || ^20.9.0 || >=21.1.0`.
    ESLint 10 has a higher Node.js minimum.

### Fixed

-   Replace textual identifier matching with TypeScript symbol resolution, leaving
    unrelated local variables, object properties and nested class members intact.
-   Prevent partial conversion when bracket access (`object['value']`), dynamic
    keys, external references or unsupported runtime operations are present.
-   Withhold unsafe fixes for optional chains, `any`, reflection, destructuring,
    spread, static `this`, accessor pairs, overloads and private name collisions.
-   Ignore private constructors and constructor parameter properties, which have
    no direct native-private equivalent. Fix other class members and their
    references inside constructors while retaining these declarations.
-   Report private methods correctly, plus non-identifier declarations that
    previously escaped diagnostics.
-   Export usable CommonJS TypeScript declarations and link rule documentation.
-   Clean build output before packaging so the removed rule is not shipped.

### Added

-   Independent `fields`, `methods`, `getters`, `setters` and `auto-accessors`
    rules with standard ESLint `error`, `warn` and `off` severities per member kind.
-   A `members` option on the aggregate `typescript-private` rule to select fields,
    methods, getters, setters and auto-accessors at one shared severity.
-   Ready-to-use named flat presets: `recommended` and `recommended-type-checked`.
    The typed preset enables Project Service for safe autofix; both include the
    parser, plugin registration, file patterns and recommended rule.
-   Support ESLint `^8.57.0 || ^9.0.0 || ^10.0.0` and TypeScript `>=4.8.4 <6.1.0`.
-   Regression tests and CI compatibility coverage across ESLint major versions.
-   Flat and legacy configuration examples, autofix limitations and migration guide.

## [1.0.1]

Previous published version; no historical release notes were recorded here.

[2.0.0]: https://github.com/FullDream/eslint-plugin-enforce-es-private/compare/v1.0.1...v2.0.0
[1.0.1]: https://github.com/FullDream/eslint-plugin-enforce-es-private/releases/tag/v1.0.1
