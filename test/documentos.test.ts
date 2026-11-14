import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calcularDigitosCnpj,
  calcularDigitosCpf,
  cnpjValido,
  cpfValido,
  documentoValido,
  formatarCnpj,
  formatarCpf,
  gerarCnpj,
  gerarCpf,
  tipoDeDocumento,
} from '../src/index.ts';

describe('CNPJ numérico', () => {
  it('aceita um CNPJ válido, com ou sem pontuação', () => {
    assert.equal(cnpjValido('11.222.333/0001-81'), true);
    assert.equal(cnpjValido('11222333000181'), true);
    assert.equal(cnpjValido(' 11 222 333 0001 81 '), true);
  });

  it('recusa dígito errado', () => {
    assert.equal(cnpjValido('11.222.333/0001-82'), false);
    assert.equal(cnpjValido('11.222.333/0001-18'), false);
  });

  it('recusa sequência repetida, que passa na conta mas não existe', () => {
    assert.equal(cnpjValido('00.000.000/0000-00'), false);
    assert.equal(cnpjValido('11.111.111/1111-11'), false);
  });

  it('recusa tamanho errado e letra no dígito verificador', () => {
    assert.equal(cnpjValido('11.222.333/0001-8'), false);
    assert.equal(cnpjValido('11.222.333/0001-811'), false);
    assert.equal(cnpjValido('12.ABC.345/01DE-3A'), false);
    assert.equal(cnpjValido(''), false);
  });
});

describe('CNPJ alfanumérico', () => {
  // Exemplo do material da Receita Federal sobre o CNPJ alfanumérico: 12.ABC.345/01DE-35.
  it('calcula os dígitos do exemplo da Receita', () => {
    assert.equal(calcularDigitosCnpj('12ABC34501DE'), '35');
    assert.equal(calcularDigitosCnpj('12.ABC.345/01DE'), '35');
  });

  it('aceita o CNPJ alfanumérico em maiúsculas ou minúsculas', () => {
    assert.equal(cnpjValido('12.ABC.345/01DE-35'), true);
    assert.equal(cnpjValido('12abc34501de35'), true);
  });

  it('recusa quando uma letra muda', () => {
    assert.equal(cnpjValido('12.ABD.345/01DE-35'), false);
  });

  it('mantém os dígitos dos CNPJs só com números', () => {
    assert.equal(calcularDigitosCnpj('112223330001'), '81');
  });

  it('recusa base com caractere fora de 0-9 e A-Z', () => {
    assert.throws(() => calcularDigitosCnpj('12ABC34501D*'), TypeError);
    assert.throws(() => calcularDigitosCnpj('12ABC'), TypeError);
  });
});

describe('CPF', () => {
  it('aceita um CPF válido, com ou sem pontuação', () => {
    assert.equal(cpfValido('529.982.247-25'), true);
    assert.equal(cpfValido('52998224725'), true);
  });

  it('calcula os dígitos', () => {
    assert.equal(calcularDigitosCpf('529982247'), '25');
  });

  it('recusa dígito errado, sequência repetida, letras e tamanho errado', () => {
    assert.equal(cpfValido('529.982.247-24'), false);
    assert.equal(cpfValido('111.111.111-11'), false);
    assert.equal(cpfValido('529.982.24A-25'), false);
    assert.equal(cpfValido('5299822472'), false);
  });
});

describe('tipo, formatação e documento', () => {
  it('diz o tipo pelo formato', () => {
    assert.equal(tipoDeDocumento('529.982.247-25'), 'cpf');
    assert.equal(tipoDeDocumento('12.ABC.345/01DE-35'), 'cnpj');
    assert.equal(tipoDeDocumento('123'), null);
  });

  it('confere CPF ou CNPJ', () => {
    assert.equal(documentoValido('529.982.247-25'), true);
    assert.equal(documentoValido('12.ABC.345/01DE-35'), true);
    assert.equal(documentoValido('529.982.247-24'), false);
    assert.equal(documentoValido('abc'), false);
  });

  it('formata e devolve null quando não dá', () => {
    assert.equal(formatarCnpj('12abc34501de35'), '12.ABC.345/01DE-35');
    assert.equal(formatarCnpj('11222333000181'), '11.222.333/0001-81');
    assert.equal(formatarCpf('52998224725'), '529.982.247-25');
    assert.equal(formatarCnpj('123'), null);
    assert.equal(formatarCpf('123'), null);
  });
});

describe('geradores para testes', () => {
  it('geram documentos válidos', () => {
    for (let i = 0; i < 500; i++) {
      assert.equal(cnpjValido(gerarCnpj()), true);
      assert.equal(cnpjValido(gerarCnpj({ alfanumerico: true })), true);
      assert.equal(cpfValido(gerarCpf()), true);
    }
  });

  it('o CNPJ numérico só tem números e o alfanumérico tem letras às vezes', () => {
    assert.match(gerarCnpj(), /^[0-9]{14}$/);
    const alfanumericos = Array.from({ length: 50 }, () => gerarCnpj({ alfanumerico: true }));
    assert.ok(alfanumericos.every((c) => /^[A-Z0-9]{12}[0-9]{2}$/.test(c)));
    assert.ok(alfanumericos.some((c) => /[A-Z]/.test(c)));
  });
});
