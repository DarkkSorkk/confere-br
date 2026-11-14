import { digitoModulo11 } from './modulo11.ts';

/** Tira pontos, barras, hífens e espaços, e passa para maiúsculas. */
export const limparDocumento = (texto: string): string => texto.toUpperCase().replace(/[\s./-]/g, '');

// O CNPJ alfanumérico aceita letras nas 12 primeiras posições; os 2 dígitos verificadores continuam
// numéricos. Aqui vale qualquer letra de A a Z: a exclusão de algumas letras aparece em resumos da
// norma, mas não na regra de cálculo publicada.
const FORMATO_CNPJ = /^[A-Z0-9]{12}[0-9]{2}$/;
const FORMATO_CPF = /^[0-9]{11}$/;

// Sequências de um caractere só (000.000.000-00, 11.111.111/1111-11) passam na conta, mas não existem.
const repetido = (documento: string): boolean => /^(.)\1*$/.test(documento);

/** Os 2 dígitos verificadores de um CNPJ, a partir das 12 primeiras posições (números ou letras). */
export const calcularDigitosCnpj = (base: string): string => {
  const limpa = limparDocumento(base);
  if (!/^[A-Z0-9]{12}$/.test(limpa)) {
    throw new TypeError('A base do CNPJ precisa ter 12 caracteres, números ou letras de A a Z.');
  }
  const primeiro = digitoModulo11(limpa);
  return `${primeiro}${digitoModulo11(limpa + primeiro)}`;
};

/** Os 2 dígitos verificadores de um CPF, a partir dos 9 primeiros números. */
export const calcularDigitosCpf = (base: string): string => {
  const limpa = limparDocumento(base);
  if (!/^[0-9]{9}$/.test(limpa)) {
    throw new TypeError('A base do CPF precisa ter 9 números.');
  }
  const primeiro = digitoModulo11(limpa, 11);
  return `${primeiro}${digitoModulo11(limpa + primeiro, 11)}`;
};

/** CNPJ numérico ou alfanumérico, com ou sem pontuação. */
export const cnpjValido = (texto: string): boolean => {
  const cnpj = limparDocumento(texto);
  if (!FORMATO_CNPJ.test(cnpj) || repetido(cnpj)) return false;
  return cnpj.slice(12) === calcularDigitosCnpj(cnpj.slice(0, 12));
};

/** CPF, com ou sem pontuação. */
export const cpfValido = (texto: string): boolean => {
  const cpf = limparDocumento(texto);
  if (!FORMATO_CPF.test(cpf) || repetido(cpf)) return false;
  return cpf.slice(9) === calcularDigitosCpf(cpf.slice(0, 9));
};

/** Diz se o texto tem o formato de um CPF ou de um CNPJ, sem conferir os dígitos. */
export const tipoDeDocumento = (texto: string): 'cnpj' | 'cpf' | null => {
  const documento = limparDocumento(texto);
  if (FORMATO_CPF.test(documento)) return 'cpf';
  if (FORMATO_CNPJ.test(documento)) return 'cnpj';
  return null;
};

/** CPF ou CNPJ válido. */
export const documentoValido = (texto: string): boolean => {
  const tipo = tipoDeDocumento(texto);
  if (tipo === 'cpf') return cpfValido(texto);
  if (tipo === 'cnpj') return cnpjValido(texto);
  return false;
};

/** 12.ABC.345/01DE-35, ou null se o texto não tiver o formato de um CNPJ. */
export const formatarCnpj = (texto: string): string | null => {
  const c = limparDocumento(texto);
  if (!FORMATO_CNPJ.test(c)) return null;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
};

/** 529.982.247-25, ou null se o texto não tiver o formato de um CPF. */
export const formatarCpf = (texto: string): string | null => {
  const c = limparDocumento(texto);
  if (!FORMATO_CPF.test(c)) return null;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
};

const NUMEROS = '0123456789';
const NUMEROS_E_LETRAS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const sortear = (alfabeto: string, tamanho: number): string => {
  const valores = crypto.getRandomValues(new Uint32Array(tamanho));
  return Array.from(valores, (v) => alfabeto[v % alfabeto.length]).join('');
};

/**
 * Um CNPJ válido ao acaso, para testes e dados de exemplo. Com `alfanumerico: true`, as 12 primeiras
 * posições podem ter letras. Não é um CNPJ registrado.
 */
export const gerarCnpj = (opcoes: { alfanumerico?: boolean } = {}): string => {
  for (;;) {
    const base = sortear(opcoes.alfanumerico ? NUMEROS_E_LETRAS : NUMEROS, 12);
    const cnpj = base + calcularDigitosCnpj(base);
    if (!repetido(cnpj)) return cnpj;
  }
};

/** Um CPF válido ao acaso, para testes e dados de exemplo. Não é um CPF registrado. */
export const gerarCpf = (): string => {
  for (;;) {
    const base = sortear(NUMEROS, 9);
    const cpf = base + calcularDigitosCpf(base);
    if (!repetido(cpf)) return cpf;
  }
};
