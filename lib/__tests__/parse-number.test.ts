import { parseLocaleNumber } from '../parse-number'

describe('parseLocaleNumber', () => {
  describe('Formato Argentino (punto miles, coma decimal)', () => {
    test('USD 124,99 → 124.99', () => {
      expect(parseLocaleNumber('USD 124,99')).toBe(124.99)
    })

    test('$ 17.998,56 → 17998.56', () => {
      expect(parseLocaleNumber('$ 17.998,56')).toBe(17998.56)
    })

    test('1.234.567,89 → 1234567.89', () => {
      expect(parseLocaleNumber('1.234.567,89')).toBe(1234567.89)
    })

    test('136.490 (miles) → 136490', () => {
      expect(parseLocaleNumber('136.490')).toBe(136490)
    })

    test('2.500 (miles) → 2500', () => {
      expect(parseLocaleNumber('2.500')).toBe(2500)
    })

    test('39.720 (miles) → 39720', () => {
      expect(parseLocaleNumber('39.720')).toBe(39720)
    })
  })

  describe('Formato US (coma miles, punto decimal)', () => {
    test('123.10 → 123.10', () => {
      expect(parseLocaleNumber('123.10')).toBe(123.10)
    })

    test('1,234.56 → 1234.56', () => {
      expect(parseLocaleNumber('1,234.56')).toBe(1234.56)
    })

    test('$ 12,345.67 → 12345.67', () => {
      expect(parseLocaleNumber('$ 12,345.67')).toBe(12345.67)
    })
  })

  describe('Espacios como separadores de miles', () => {
    test('12 345,67 → 12345.67', () => {
      expect(parseLocaleNumber('12 345,67')).toBe(12345.67)
    })

    test('1 234 567,89 → 1234567.89', () => {
      expect(parseLocaleNumber('1 234 567,89')).toBe(1234567.89)
    })
  })

  describe('Números negativos', () => {
    test('($ 2.345,00) → -2345', () => {
      expect(parseLocaleNumber('($ 2.345,00)')).toBe(-2345)
    })

    test('(124,99) → -124.99', () => {
      expect(parseLocaleNumber('(124,99)')).toBe(-124.99)
    })

    test('-124,99 → -124.99', () => {
      expect(parseLocaleNumber('-124,99')).toBe(-124.99)
    })
  })

  describe('Números ya parseados', () => {
    test('1234.56 (number) → 1234.56', () => {
      expect(parseLocaleNumber(1234.56)).toBe(1234.56)
    })

    test('0 → 0', () => {
      expect(parseLocaleNumber(0)).toBe(0)
    })

    test('NaN → null', () => {
      expect(parseLocaleNumber(NaN)).toBe(null)
    })

    test('Infinity → null', () => {
      expect(parseLocaleNumber(Infinity)).toBe(null)
    })
  })

  describe('Valores inválidos', () => {
    test('string vacío → null', () => {
      expect(parseLocaleNumber('')).toBe(null)
    })

    test('null → null', () => {
      expect(parseLocaleNumber(null)).toBe(null)
    })

    test('undefined → null', () => {
      expect(parseLocaleNumber(undefined)).toBe(null)
    })

    test('"NA" → null', () => {
      expect(parseLocaleNumber('NA')).toBe(null)
    })

    test('"abc" → null', () => {
      expect(parseLocaleNumber('abc')).toBe(null)
    })
  })

  describe('NBSP y espacios raros', () => {
    test('NBSP (\\u00A0) como separador → correcto', () => {
      expect(parseLocaleNumber('12\u00A0345,67')).toBe(12345.67)
    })

    test('Narrow NBSP (\\u202F) → correcto', () => {
      expect(parseLocaleNumber('1\u202F234\u202F567,89')).toBe(1234567.89)
    })
  })

  describe('Casos edge especiales', () => {
    test('Solo punto: "1234." → 1234', () => {
      expect(parseLocaleNumber('1234.')).toBe(1234)
    })

    test('Solo coma: "1234," → 1234', () => {
      expect(parseLocaleNumber('1234,')).toBe(1234)
    })

    test('Múltiples puntos sin coma: "1.234.567" → 1234567', () => {
      expect(parseLocaleNumber('1.234.567')).toBe(1234567)
    })

    test('Precio con símbolo Euro: "€ 1.234,56" → 1234.56', () => {
      expect(parseLocaleNumber('€ 1.234,56')).toBe(1234.56)
    })
  })

  describe('Casos del bug original', () => {
    test('Caso MOURA: "17.998,56" → 17998.56 (NO 17998560)', () => {
      expect(parseLocaleNumber('17.998,56')).toBe(17998.56)
    })

    test('Caso LUSQTOFF: "124,99" → 124.99 (NO 124)', () => {
      expect(parseLocaleNumber('124,99')).toBe(124.99)
    })

    test('Caso ambiguo: "123.10" → 123.10 (NO 12310)', () => {
      expect(parseLocaleNumber('123.10')).toBe(123.10)
    })
  })
})

