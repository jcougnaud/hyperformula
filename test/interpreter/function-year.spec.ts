import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function YEAR', () => {
  it('validate arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=YEAR(1, 2)'],
      ['=YEAR()'],
      ['=YEAR("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('with numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([['=YEAR(0)', '=YEAR(2)', '=YEAR(43465)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(1899)
    expect(engine.getCellValue(adr('B1'))).toEqual(1900)
    expect(engine.getCellValue(adr('C1'))).toEqual(2018)
  })

  it('with string arguments', () => {
    const engine = HyperFormula.buildFromArray([['=YEAR("31/12/1899")', '=YEAR("01/01/1900")', '=YEAR("31/12/2018")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(1899)
    expect(engine.getCellValue(adr('B1'))).toEqual(1900)
    expect(engine.getCellValue(adr('C1'))).toEqual(2018)
  })

  it('use datenumber coercion for 1st argument', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=YEAR(TRUE())'],
      ['=YEAR(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1899)
    expect(engine.getCellValue(adr('A2'))).toEqual(1899)
  })

  it('propagate errors', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=YEAR(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value in 1st argument results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)', '=YEAR(A1:A3)'],
      ['=DATE(2018, 3, 31)', '=YEAR(A1:A3)'],
      ['=DATE(2017, 3, 31)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
