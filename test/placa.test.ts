import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { placaParaMercosul, placaValida, tipoDePlaca } from '../src/index.ts';

describe('placa', () => {
  it('reconhece os dois formatos, com ou sem hífen', () => {
    assert.equal(tipoDePlaca('ABC-1234'), 'antiga');
    assert.equal(tipoDePlaca('abc1d23'), 'mercosul');
    assert.equal(tipoDePlaca('AB1234'), null);
    assert.equal(tipoDePlaca('ABC12345'), null);
    assert.equal(placaValida('ABC1D23'), true);
    assert.equal(placaValida('1BC1D23'), false);
  });

  it('converte a placa antiga para o Mercosul (segundo número vira letra)', () => {
    assert.equal(placaParaMercosul('ABC-1234'), 'ABC1C34');
    assert.equal(placaParaMercosul('XYZ1034'), 'XYZ1A34');
    assert.equal(placaParaMercosul('XYZ1934'), 'XYZ1J34');
  });

  it('devolve a Mercosul igual e null para o que não é placa', () => {
    assert.equal(placaParaMercosul('ABC1D23'), 'ABC1D23');
    assert.equal(placaParaMercosul('ABC'), null);
  });
});
