import * as fs from 'fs'
import * as path from 'path'
import {HandsOnEngine} from '../src'

const formulasCsvPath = path.resolve(process.cwd(), process.argv[2])
if (process.argv.length < 4) {
  console.warn('Usage:\nyarn ts-node bin/handsonengine-convert formulas.csv output.csv')
  process.exit(1)
}
const outputCsvPath = path.resolve(process.cwd(), process.argv[3])

if (!fs.existsSync(formulasCsvPath)) {
  console.warn(`File ${formulasCsvPath} does not exist.`)
  process.exit(1)
}

const formulasCsvString = fs.readFileSync(formulasCsvPath, { encoding: 'utf8' })
const engine = HandsOnEngine.buildFromCsv(formulasCsvString)
const exportedCsvString = engine.exportAsCsv()

fs.writeFileSync(outputCsvPath, exportedCsvString)