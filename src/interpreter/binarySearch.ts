/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {InternalScalarValue, simpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {InterpreterValue} from './InterpreterValue'

/*
* If key exists returns first index of key element in range of sorted values
* Otherwise returns first index of greatest element smaller than key
* assuming sorted values in range
* */
export function rangeLowerBound(range: AbsoluteCellRange, key: InternalScalarValue, dependencyGraph: DependencyGraph, coordinate: 'row' | 'col'): number {
  let end
  if(coordinate === 'col') {
    end = range.effectiveEndColumn(dependencyGraph)
  } else {
    end = range.effectiveEndRow(dependencyGraph)
  }
  const start = range.start[coordinate]

  let centerValueFn
  if (coordinate === 'row') {
    centerValueFn = (center: number) =>  dependencyGraph.getCellValue(simpleCellAddress(range.sheet, range.start.col, center))
  } else {
    centerValueFn = (center: number) =>  dependencyGraph.getCellValue(simpleCellAddress(range.sheet, center, range.start.row))
  }

  return lowerBound(centerValueFn, key, start, end)
}

/*
* If key exists returns first index of key element
* Otherwise returns first index of greatest element smaller than key
* assuming sorted values
* */
export function lowerBound(value: (index: number) => InterpreterValue, key: InternalScalarValue, start: number, end: number): number {
  while (start <= end) {
    const center = Math.floor((start + end) / 2)
    const cmp = compare(key, value(center))
    if (cmp > 0) {
      start = center + 1
    } else if (cmp < 0) {
      end = center - 1
    } else if (start != center) {
      end = center
    } else {
      return center
    }
  }

  return end
}

/*
* numbers < strings < false < true
* */
export function compare(left: any, right: any): number {
  if (typeof left === typeof right) {
    return (left < right ? -1 : (left > right ? 1 : 0))
  }
  if (typeof left === 'number' && typeof right === 'string') {
    return -1
  }
  if (typeof left === 'number' && typeof right === 'boolean') {
    return -1
  }
  if (typeof left === 'string' && typeof right === 'number') {
    return 1
  }
  if (typeof left === 'string' && typeof right === 'boolean') {
    return -1
  }
  return 1
}
