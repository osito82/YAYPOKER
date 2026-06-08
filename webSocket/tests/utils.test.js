import { describe, it, expect, vi } from 'vitest'
const utils = require('../utils')

describe('Utils Functions', () => {
  it('shuffle should return array with same elements', () => {
    const arr = [1, 2, 3, 4, 5]
    const shuffled = utils.shuffle([...arr])
    expect(shuffled.sort()).toEqual(arr.sort())
  })

  it('generateUniqueId should return an 11-character string in the format XXXXX-XXXXX', () => {
    const id = utils.generateUniqueId()

    // Check exact length
    expect(id.length).toBe(11)

    // Check format: 5 alphanumeric characters, a hyphen, 5 alphanumeric characters
    // Using hex pattern since we rely on UUID, but A-Z covers any future base36 swap
    expect(id).toMatch(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/)
  })

  it('cardsToNoSymbolValsArray should strip suits', () => {
    const input = ['Ks', '8c', 'Js', 'Td', 'Qc']
    const expected = ['K', '8', 'J', 'T', 'Q']
    expect(utils.cardsToNoSymbolValsArray(input)).toEqual(expected)
  })

  it('singleSymbolsToNumsArray should convert symbols to numbers', () => {
    const input = ['K', '8', 'J', 'T', 'Q', 'A', '3']
    const expected = [13, 8, 11, 10, 12, 14, 3]
    expect(utils.singleSymbolsToNumsArray(input)).toEqual(expected)
  })

  it('cardsToSingleNumValsArray should convert cards to numbers', () => {
    const input = ['Ks', '8c', 'Js', 'Td', 'Qc']
    const expected = [13, 8, 11, 10, 12]
    expect(utils.cardsToSingleNumValsArray(input)).toEqual(expected)
  })

  it('numberToCard should convert numbers to symbols', () => {
    expect(utils.numberToCard(10)).toBe('T')
    expect(utils.numberToCard(11)).toBe('J')
    expect(utils.numberToCard(12)).toBe('Q')
    expect(utils.numberToCard(13)).toBe('K')
    expect(utils.numberToCard(14)).toBe('A')
    expect(utils.numberToCard(7)).toBe('7')
  })

  it('singleValsToSymbolsArray should convert numbers array to symbols array', () => {
    const input = [13, 8, 11, 10, 12]
    const expected = ['K', '8', 'J', 'T', 'Q']
    expect(utils.singleValsToSymbolsArray(input)).toEqual(expected)
  })

  it('selectArrayWithBiggestNumbers should return array with highest sum', () => {
    const input = [
      [1, 4, 11, 5, 3],
      [13, 8, 11, 10, 12],
    ]
    expect(utils.selectArrayWithBiggestNumbers(input)).toEqual([
      13, 8, 11, 10, 12,
    ])
    expect(utils.selectArrayWithBiggestNumbers([])).toBeNull()
  })

  it('highestCardNumberFromArray should return highest card as symbol', () => {
    const input = [1, 4, 11, 5, 3]
    expect(utils.highestCardNumberFromArray(input)).toBe('J')
  })

  it('uniqueElementsArray should remove duplicates', () => {
    const input = [4, 4, 8, 8, 2]
    const expected = [4, 8, 2]
    expect(utils.uniqueElementsArray(input)).toEqual(expected)
  })

  it('notRepeatedInIntArray should remove repeated card numbers', () => {
    const input = ['Ks', '8c', '8s', 'Js', 'Td', 'Qc']
    const expected = [13, 11, 10, 12] // '8' is repeated, removed
    expect(utils.notRepeatedInIntArray(input)).toEqual([13, 11, 10, 12])
  })

  it('notRepeatedSymbolnArray should remove repeated symbols', () => {
    const input = ['K', 'K', 'K', '8', 'K']
    expect(utils.notRepeatedSymbolnArray(input)).toEqual(['8'])
  })

  it('msgBuilder should build proper message object', () => {
    const player = { id: 1, name: 'John' }
    const result = utils.msgBuilder('action', 'type', player, { test: 123 })
    expect(result).toEqual({
      action: 'action',
      msgType: 'type',
      playerId: 1,
      name: 'John',
      data: { test: 123 },
    })
  })

  it('randomName should return string ending with 4 digits', () => {
    const name = utils.randomName()
    expect(name).toMatch(/-\d{4}$/)
  })

  it('sumArrayNumbers should sum numbers', () => {
    const arr = [1, 2, 3, 4]
    expect(utils.sumArrayNumbers(arr)).toBe(10)
  })

  it('compareArraysNoOrder should compare arrays correctly', () => {
    const single = ['K', 'J', '8']
    const complete = ['Ks', 'Js', '8c']
    expect(utils.compareArraysNoOrder(single, complete)).toBe(true)
  })

  it('flatToGetSymbolsArray should flatten and convert to symbols', () => {
    const input = [
      ['As', 'Ah', 'Ac'],
      ['Jc', 'Jh'],
    ]
    expect(utils.flatToGetSymbolsArray(input)).toEqual([
      'A',
      'A',
      'A',
      'J',
      'J',
    ])
  })

  it('getHigherSumArrayContent should return array with max sum', () => {
    const input = [
      [1, 2, 3],
      [6, 7, 8],
    ]
    expect(utils.getHigherSumArrayContent(input)).toEqual([6, 7, 8])
  })
})
