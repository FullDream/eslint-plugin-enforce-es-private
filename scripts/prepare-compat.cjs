const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const destination = path.join(root, '.compat')

fs.mkdirSync(destination, { recursive: true })

const pkg = require('../package.json')

// A consumer install exercises published output without development dependencies.
delete pkg.devDependencies
delete pkg.scripts
fs.writeFileSync(path.join(destination, 'package.json'), JSON.stringify(pkg, null, 2))
fs.cpSync(path.join(root, 'dist'), path.join(destination, 'dist'), { recursive: true })
fs.cpSync(path.join(root, 'tests'), path.join(destination, 'tests'), { recursive: true })
