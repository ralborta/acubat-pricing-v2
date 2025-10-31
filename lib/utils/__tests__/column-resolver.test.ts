import { resolverColumnaPrecio, getCellPrecioFlexible } from '../column-resolver';

describe('resolverColumnaPrecio', () => {
  describe('Match exacto', () => {
    test('PRECIO DE LISTA → match', () => {
      const headers = ['CÓDIGO BATERÍAS', 'TIPO', 'PRECIO DE LISTA'];
      expect(resolverColumnaPrecio(headers)).toBe('PRECIO DE LISTA');
    });

    test('Precio Lista → match', () => {
      const headers = ['Código', 'Modelo', 'Precio Lista'];
      expect(resolverColumnaPrecio(headers)).toBe('Precio Lista');
    });

    test('precio → match', () => {
      const headers = ['codigo', 'tipo', 'precio'];
      expect(resolverColumnaPrecio(headers)).toBe('precio');
    });

    test('P. Lista → match', () => {
      const headers = ['SKU', 'Descripción', 'P. Lista'];
      expect(resolverColumnaPrecio(headers)).toBe('P. Lista');
    });

    test('Contado → match (solo MOURA)', () => {
      const headers = ['Artículo', 'Contado', 'Tarjeta'];
      // "Contado" solo se encuentra si es MOURA
      expect(resolverColumnaPrecio(headers, false)).toBeNull(); // No MOURA = no encuentra Contado
      expect(resolverColumnaPrecio(headers, true)).toBe('Contado'); // MOURA = encuentra Contado
    });

    test('PDV → match', () => {
      const headers = ['Producto', 'PDV', 'Stock'];
      expect(resolverColumnaPrecio(headers)).toBe('PDV');
    });

    test('PVP → match', () => {
      const headers = ['Item', 'PVP', 'Disponible'];
      expect(resolverColumnaPrecio(headers)).toBe('PVP');
    });
  });

  describe('Normalización (tildes, mayúsculas)', () => {
    test('PRECIO con tilde → match', () => {
      const headers = ['Código', 'Précio de Lista'];
      expect(resolverColumnaPrecio(headers)).toBe('Précio de Lista');
    });

    test('PRECIO    DE    LISTA (espacios múltiples) → match', () => {
      const headers = ['SKU', 'PRECIO    DE    LISTA'];
      expect(resolverColumnaPrecio(headers)).toBe('PRECIO    DE    LISTA');
    });
  });

  describe('Columnas BLOQUEADAS (NUNCA deben matchear)', () => {
    test('TIPO → NO match', () => {
      const headers = ['CÓDIGO', 'TIPO', 'DESCRIPCIÓN'];
      expect(resolverColumnaPrecio(headers)).toBeNull();
    });

    test('CÓDIGO BATERÍAS → NO match', () => {
      const headers = ['CÓDIGO BATERÍAS', 'MODELO', 'MARCA'];
      expect(resolverColumnaPrecio(headers)).toBeNull();
    });

    test('MODELO → NO match', () => {
      const headers = ['SKU', 'MODELO', 'FAMILIA'];
      expect(resolverColumnaPrecio(headers)).toBeNull();
    });

    test('DESCRIPCIÓN → NO match', () => {
      const headers = ['ID', 'DESCRIPCIÓN', 'STOCK'];
      expect(resolverColumnaPrecio(headers)).toBeNull();
    });

    test('CCA → NO match', () => {
      const headers = ['Batería', 'CCA', 'Voltaje'];
      expect(resolverColumnaPrecio(headers)).toBeNull();
    });

    test('CAPACIDAD → NO match', () => {
      const headers = ['Producto', 'CAPACIDAD', 'Alto'];
      expect(resolverColumnaPrecio(headers)).toBeNull();
    });
  });

  describe('Match fuerte (precio + lista/base/unitario)', () => {
    test('Precio Unitario Base → match fuerte', () => {
      const headers = ['SKU', 'Precio Unitario Base', 'Stock'];
      expect(resolverColumnaPrecio(headers)).toBe('Precio Unitario Base');
    });

    test('Precio de Lista Sugerido → match fuerte', () => {
      const headers = ['Artículo', 'Precio de Lista Sugerido'];
      expect(resolverColumnaPrecio(headers)).toBe('Precio de Lista Sugerido');
    });
  });

  describe('Casos REALES del bug', () => {
    test('MOURA: No confundir TIPO con PRECIO DE LISTA', () => {
      const headers = ['CÓDIGO BATERÍAS', 'TIPO', 'PRECIO DE LISTA', 'STOCK'];
      const resultado = resolverColumnaPrecio(headers);
      
      expect(resultado).toBe('PRECIO DE LISTA');
      expect(resultado).not.toBe('TIPO');
    });

    test('LUSQTOFF: Headers con variantes', () => {
      const headers = ['Código', 'Marca', 'Modelo', 'Precio'];
      expect(resolverColumnaPrecio(headers)).toBe('Precio');
    });

    test('Excel con "12X45" en TIPO no debe matchear', () => {
      const headers = ['ID', 'TIPO', 'PRECIO'];
      expect(resolverColumnaPrecio(headers)).toBe('PRECIO');
    });
  });
});

describe('getCellPrecioFlexible', () => {
  test('Obtiene valor de columna correcta', () => {
    const row = {
      'CÓDIGO BATERÍAS': 'M40FD',
      'TIPO': '12X45',
      'PRECIO DE LISTA': '$136.490',
    };
    
    expect(getCellPrecioFlexible(row)).toBe('$136.490');
  });

  test('Ignora columnas bloqueadas', () => {
    const row = {
      'MODELO': 'ABC123',
      'TIPO': '12X45',
      'precio': '124,99',
    };
    
    expect(getCellPrecioFlexible(row)).toBe('124,99');
  });

  test('Retorna undefined si no hay columna de precio', () => {
    const row = {
      'CÓDIGO': '123',
      'MODELO': 'XYZ',
      'TIPO': '12X45',
    };
    
    expect(getCellPrecioFlexible(row)).toBeUndefined();
  });
});

