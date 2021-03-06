/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {ErrorType, SimpleCellAddress} from '../Cell'
import {
  Ast,
  AstNodeType,
  CellRangeAst,
  ColumnRangeAst,
  imageWithWhitespace,
  RangeSheetReferenceType,
  RowRangeAst,
} from './Ast'
import {binaryOpTokenMap} from './binaryOpTokenMap'
import {ILexerConfig} from './LexerConfig'
import {ParserConfig} from './ParserConfig'
import {NamedExpressions} from '../NamedExpressions'
import {SheetIndexMappingFn, sheetIndexToString} from './addressRepresentationConverters'
import {NoSheetWithIdError} from '../index'

export class Unparser {
  constructor(
    private readonly config: ParserConfig,
    private readonly lexerConfig: ILexerConfig,
    private readonly sheetMappingFn: SheetIndexMappingFn,
    private readonly namedExpressions: NamedExpressions,
  ) {
  }

  public unparse(ast: Ast, address: SimpleCellAddress): string {
    return '=' + this.unparseAst(ast, address)
  }

  private unparseAst(ast: Ast, address: SimpleCellAddress): string {
    switch (ast.type) {
      case AstNodeType.EMPTY: {
        return imageWithWhitespace('', ast.leadingWhitespace)
      }
      case AstNodeType.NUMBER: {
        return imageWithWhitespace(formatNumber(ast.value, this.config.decimalSeparator), ast.leadingWhitespace)
      }
      case AstNodeType.STRING: {
        return imageWithWhitespace('"' + ast.value + '"', ast.leadingWhitespace)
      }
      case AstNodeType.FUNCTION_CALL: {
        const args = ast.args.map((arg) => arg!==undefined?this.unparseAst(arg, address):''
        ).join(this.config.functionArgSeparator)
        const procedureName = this.config.translationPackage.isFunctionTranslated(ast.procedureName) ?
          this.config.translationPackage.getFunctionTranslation(ast.procedureName) :
          ast.procedureName
        const rightPart = procedureName + '(' + args + imageWithWhitespace(')', ast.internalWhitespace)
        return imageWithWhitespace(rightPart, ast.leadingWhitespace)
      }
      case AstNodeType.NAMED_EXPRESSION: {
        const originalNamedExpressionName = this.namedExpressions.nearestNamedExpression(ast.expressionName, address.sheet)?.displayName
        return imageWithWhitespace(originalNamedExpressionName || ast.expressionName, ast.leadingWhitespace)
      }
      case AstNodeType.CELL_REFERENCE: {
        let image
        if (ast.reference.sheet !== null) {
          image = this.unparseSheetName(ast.reference.sheet) + '!' + ast.reference.unparse(address)
        } else {
          image = ast.reference.unparse(address)
        }
        return imageWithWhitespace(image, ast.leadingWhitespace)
      }
      case AstNodeType.COLUMN_RANGE:
      case AstNodeType.ROW_RANGE:
      case AstNodeType.CELL_RANGE: {
        return imageWithWhitespace(this.formatRange(ast, address), ast.leadingWhitespace)
      }
      case AstNodeType.PLUS_UNARY_OP: {
        const unparsedExpr = this.unparseAst(ast.value, address)
        return imageWithWhitespace('+', ast.leadingWhitespace) + unparsedExpr
      }
      case AstNodeType.MINUS_UNARY_OP: {
        const unparsedExpr = this.unparseAst(ast.value, address)
        return imageWithWhitespace('-', ast.leadingWhitespace) + unparsedExpr
      }
      case AstNodeType.PERCENT_OP: {
        return this.unparseAst(ast.value, address) + imageWithWhitespace('%', ast.leadingWhitespace)
      }
      case AstNodeType.ERROR: {
        const image = this.config.translationPackage.getErrorTranslation(
          ast.error ? ast.error.type : ErrorType.ERROR
        )
        return imageWithWhitespace(image, ast.leadingWhitespace)
      }
      case AstNodeType.ERROR_WITH_RAW_INPUT: {
        return imageWithWhitespace(ast.rawInput, ast.leadingWhitespace)
      }
      case AstNodeType.PARENTHESIS: {
        const expression = this.unparseAst(ast.expression, address)
        const rightPart = '(' + expression + imageWithWhitespace(')', ast.internalWhitespace)
        return imageWithWhitespace(rightPart, ast.leadingWhitespace)
      }
      default: {
        const left = this.unparseAst(ast.left, address)
        const right = this.unparseAst(ast.right, address)
        return left + imageWithWhitespace(binaryOpTokenMap[ast.type], ast.leadingWhitespace) + right
      }
    }
  }

  private unparseSheetName(sheetId: number): string {
    const sheetName = sheetIndexToString(sheetId, this.sheetMappingFn)
    if (sheetName === undefined) {
      throw new NoSheetWithIdError(sheetId)
    }
    return sheetName
  }

  private formatRange(ast: CellRangeAst | ColumnRangeAst | RowRangeAst, baseAddress: SimpleCellAddress): string {
    let startSheeet = ''
    let endSheet = ''

    if (ast.start.sheet !== null && (ast.sheetReferenceType !== RangeSheetReferenceType.RELATIVE)) {
      startSheeet = this.unparseSheetName(ast.start.sheet) + '!'
    }

    if (ast.end.sheet !== null && ast.sheetReferenceType === RangeSheetReferenceType.BOTH_ABSOLUTE) {
      endSheet = this.unparseSheetName(ast.end.sheet) + '!'
    }

    return `${startSheeet}${ast.start.unparse(baseAddress)}:${endSheet}${ast.end.unparse(baseAddress)}`
  }
}

export function formatNumber(number: number, decimalSeparator: string): string {
  const numericString = number.toString()
  return numericString.replace('.', decimalSeparator)
}
