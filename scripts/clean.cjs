const { rmSync } = require('node:fs')
const path = require('node:path')

// Always target the generated output beside this script's project root.
rmSync(path.resolve(__dirname, '../dist'), { recursive: true, force: true })
