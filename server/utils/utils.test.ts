import { ParsedQs } from 'qs'
import { convertToTitleCase, initialiseName, queryParamToEncodedString } from './utils'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('query param to string', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', ''],
    ['String', 'robert', 'robert'],
    ['Encoded string', 'http://robert?james&smith', 'http%3A%2F%2Frobert%3Fjames%26smith'],
    ['String array', ['Robert', 'James'], null],
    ['ParsedQs', { key: 'Robert James Smith' }, null],
    ['ParsedQs array', [{ key: 'Robert James Smith' }, { key2: 'Robert James Smith' }], null],
  ])('%s initialiseName(%s, %s)', (_: string, a: string | string[] | ParsedQs | ParsedQs[], expected: string) => {
    expect(queryParamToEncodedString(a)).toEqual(expected)
  })
})
