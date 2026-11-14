import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calcularDigitoChave, chaveDeAcessoValida, formatarChaveDeAcesso, lerChaveDeAcesso } from '../src/index.ts';

// Chaves de exemplo, montadas com CNPJs e CPF de teste (não são notas reais).
const CHAVE_CNPJ = '35261111222333000181550010000012341123456780';
const CHAVE_CNPJ_ALFANUMERICO = '35260812ABC34501DE35550010000000421876543214';
const CHAVE_CPF = '51261000052998224725550010000000101112233445';

describe('dígito da chave de acesso', () => {
  // Exemplo do Manual de Orientação do Contribuinte da NF-e (cálculo do dígito verificador da chave).
  it('calcula o dígito do exemplo do manual', () => {
    assert.equal(calcularDigitoChave('5206043300991100250655012000000780026730161'), '5');
  });

  it('calcula com letras do CNPJ alfanumérico (código ASCII menos 48)', () => {
    assert.equal(calcularDigitoChave(CHAVE_CNPJ_ALFANUMERICO.slice(0, 43)), '4');
  });

  it('recusa base fora do formato', () => {
    assert.throws(() => calcularDigitoChave('123'), TypeError);
    assert.throws(() => calcularDigitoChave('A206043300991100250655012000000780026730161'), TypeError);
  });
});

describe('leitura da chave', () => {
  it('separa as partes de uma NF-e com CNPJ numérico', () => {
    const lida = lerChaveDeAcesso(CHAVE_CNPJ);
    assert.equal(lida.valida, true);
    assert.deepEqual(lida.problemas, []);
    assert.deepEqual(lida.partes, {
      codigoUf: '35',
      uf: 'SP',
      ano: 2026,
      mes: 11,
      emitente: { tipo: 'cnpj', documento: '11222333000181' },
      modelo: { codigo: '55', sigla: 'NF-e', nome: 'Nota Fiscal Eletrônica' },
      serie: '001',
      numero: '000001234',
      tipoEmissao: '1',
      codigoNumerico: '12345678',
      digito: '0',
    });
  });

  it('aceita o emitente com CNPJ alfanumérico', () => {
    const lida = lerChaveDeAcesso(CHAVE_CNPJ_ALFANUMERICO);
    assert.equal(lida.valida, true);
    assert.deepEqual(lida.partes?.emitente, { tipo: 'cnpj', documento: '12ABC34501DE35' });
  });

  it('aceita o emitente pessoa física (CPF com 3 zeros à esquerda)', () => {
    const lida = lerChaveDeAcesso(CHAVE_CPF);
    assert.equal(lida.valida, true);
    assert.equal(lida.partes?.uf, 'MT');
    assert.deepEqual(lida.partes?.emitente, { tipo: 'cpf', documento: '52998224725' });
  });

  it('aceita a chave impressa no DANFE, com espaços', () => {
    assert.equal(chaveDeAcessoValida('3526 1111 2223 3300 0181 5500 1000 0012 3411 2345 6780'), true);
  });

  it('recusa dígito verificador errado e diz qual seria o certo', () => {
    const lida = lerChaveDeAcesso(CHAVE_CNPJ.slice(0, 43) + '9');
    assert.equal(lida.valida, false);
    assert.deepEqual(lida.problemas, ['O dígito verificador é 9, mas as outras 43 posições pedem 0.']);
  });

  it('recusa um número trocado no meio (o dígito pega)', () => {
    const trocada = CHAVE_CNPJ.slice(0, 30) + '9' + CHAVE_CNPJ.slice(31);
    assert.equal(chaveDeAcessoValida(trocada), false);
  });

  it('recusa UF inexistente, mês inexistente e emitente inválido', () => {
    const comDigito = (base: string) => base + calcularDigitoChave(base);
    const semUf = lerChaveDeAcesso(comDigito('99' + CHAVE_CNPJ.slice(2, 43)));
    assert.deepEqual(semUf.problemas, ['O código de UF 99 não existe na tabela do IBGE.']);

    const mes13 = lerChaveDeAcesso(comDigito('352613' + CHAVE_CNPJ.slice(6, 43)));
    assert.deepEqual(mes13.problemas, ['O mês de emissão (13) não existe.']);

    const emitente = lerChaveDeAcesso(comDigito('352611' + '11222333000182' + CHAVE_CNPJ.slice(20, 43)));
    assert.deepEqual(emitente.problemas, ['O documento do emitente dentro da chave não é um CNPJ nem um CPF válido.']);
  });

  it('modelo desconhecido e tipo de emissão 0 são avisos, não problemas', () => {
    const base = '352611' + '11222333000181' + '99' + '001000001234' + '0' + '12345678';
    const lida = lerChaveDeAcesso(base + calcularDigitoChave(base));
    assert.equal(lida.valida, true);
    assert.equal(lida.partes?.modelo.sigla, null);
    assert.deepEqual(lida.avisos, [
      'O modelo 99 não está na lista de modelos conhecidos.',
      'O tipo de emissão 0 não existe no leiaute atual.',
    ]);
  });

  it('recusa tamanho errado sem tentar separar as partes', () => {
    const lida = lerChaveDeAcesso('3526111122233300018155');
    assert.equal(lida.valida, false);
    assert.equal(lida.partes, null);
    assert.deepEqual(lida.problemas, ['A chave tem 22 posições; precisa ter 44.']);
  });

  it('recusa letra fora das posições do CNPJ', () => {
    const lida = lerChaveDeAcesso('A' + CHAVE_CNPJ.slice(1));
    assert.equal(lida.valida, false);
    assert.equal(lida.partes, null);
  });
});

describe('formatação da chave', () => {
  it('separa em 11 grupos de 4', () => {
    assert.equal(formatarChaveDeAcesso(CHAVE_CNPJ), '3526 1111 2223 3300 0181 5500 1000 0012 3411 2345 6780');
    assert.equal(formatarChaveDeAcesso('123'), null);
  });
});
