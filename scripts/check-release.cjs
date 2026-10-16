const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const pkg = require('../package.json')
const lock = require('../package-lock.json')

const tag =
	process.env.RELEASE_TAG || (process.env.GITHUB_EVENT_NAME === 'workflow_dispatch' ? `v${pkg.version}` : undefined)

assert.match(pkg.version, /^\d+\.\d+\.\d+$/, 'This workflow publishes stable versions only')
assert.equal(tag, `v${pkg.version}`, 'Tag must match package.json version')
assert.equal(lock.version, pkg.version)
assert.equal(lock.packages[''].version, pkg.version)

const notes = fs.readFileSync(path.join(__dirname, '..', 'releases', `${tag}.md`), 'utf8')

assert.ok(notes.includes('Breaking changes'), 'Release notes must include breaking changes')
assert.ok(notes.includes('Migration'), 'Release notes must include migration instructions')

if (process.env.GITHUB_OUTPUT) {
	fs.appendFileSync(process.env.GITHUB_OUTPUT, `tag=${tag}\n`)
}
