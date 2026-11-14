import { cnpjValido, cpfValido, limparDocumento } from './documentos.ts';
import { digitoModulo11 } from './modulo11.ts';

// 44 posições: 6 números (UF e ano/mês), 12 números ou letras (início do CNPJ do emitente, que pode ser
// alfanumérico desde a Nota Técnica Conjunta 2025.001) e 26 números.
const FORMATO_CHAVE = /^[0-9]{6}[A-Z0-9]{12}[0-9]{26}$/;

/** Códigos de UF do IBGE usados na chave de acesso. */
export const UFS: Readonly<Record<string, string>> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
  '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
};

/** Modelos de documento fiscal eletrônico que usam a chave de 44 posições. */
export const MODELOS: Readonly<Record<string, { sigla: string; nome: string }>> = {
  '55': { sigla: 'NF-e', nome: 'Nota Fiscal Eletrônica' },
  '57': { sigla: 'CT-e', nome: 'Conhecimento de Transporte Eletrônico' },
  '58': { sigla: 'MDF-e', nome: 'Manifesto Eletrônico de Documentos Fiscais' },
  '62': { sigla: 'NFCom', nome: 'Nota Fiscal Fatura de Serviços de Comunicação Eletrônica' },
  '63': { sigla: 'BP-e', nome: 'Bilhete de Passagem Eletrônico' },
  '65': { sigla: 'NFC-e', nome: 'Nota Fiscal de Consumidor Eletrônica' },
  '66': { sigla: 'NF3e', nome: 'Nota Fiscal de Energia Elétrica Eletrônica' },
  '67': { sigla: 'CT-e OS', nome: 'Conhecimento de Transporte Eletrônico para Outros Serviços' },
};

export interface PartesDaChave {
  /** Código da UF do emitente (IBGE) e a sigla, ou null se o código não existir. */
  codigoUf: string;
  uf: string | null;
  /** Ano e mês de emissão. */
  ano: number;
  mes: number;
  /** CNPJ do emitente ou, para pessoa física, o CPF (a chave guarda o CPF com 3 zeros à esquerda). */
  emitente: { tipo: 'cnpj' | 'cpf' | null; documento: string };
  modelo: { codigo: string; sigla: string | null; nome: string | null };
  serie: string;
  numero: string;
  tipoEmissao: string;
  codigoNumerico: string;
  digito: string;
}

export interface ChaveLida {
  /** A chave passa em todas as conferências que bloqueiam: formato, dígito, UF, mês e emitente. */
  valida: boolean;
  /** A chave sem espaços nem pontuação. */
  chave: string;
  /** Por que a chave não vale. Vazio quando `valida` é true. */
  problemas: string[];
  /** Coisas incomuns que não invalidam a chave (por exemplo, um modelo fora da lista). */
  avisos: string[];
  /** As partes, quando a chave tem 44 posições no formato certo. */
  partes: PartesDaChave | null;
}

/** O dígito verificador (a 44ª posição) a partir das 43 primeiras. */
export const calcularDigitoChave = (base: string): string => {
  const limpa = limparDocumento(base);
  if (!/^[0-9]{6}[A-Z0-9]{12}[0-9]{25}$/.test(limpa)) {
    throw new TypeError('A base da chave precisa ter 43 posições no formato da chave de acesso.');
  }
  return String(digitoModulo11(limpa));
};

const separar = (chave: string): PartesDaChave => {
  const codigoUf = chave.slice(0, 2);
  const codigoModelo = chave.slice(20, 22);
  const modelo = MODELOS[codigoModelo];
  return {
    codigoUf,
    uf: UFS[codigoUf] ?? null,
    ano: 2000 + Number(chave.slice(2, 4)),
    mes: Number(chave.slice(4, 6)),
    emitente: { tipo: null, documento: chave.slice(6, 20) },
    modelo: { codigo: codigoModelo, sigla: modelo?.sigla ?? null, nome: modelo?.nome ?? null },
    serie: chave.slice(22, 25),
    numero: chave.slice(25, 34),
    tipoEmissao: chave.slice(34, 35),
    codigoNumerico: chave.slice(35, 43),
    digito: chave.slice(43, 44),
  };
};

/**
 * Lê e confere uma chave de acesso de NF-e, NFC-e, CT-e, MDF-e e outros documentos de 44 posições.
 * Aceita a chave com espaços, como aparece impressa no DANFE.
 *
 * Confere a estrutura e os dígitos. Não consulta a SEFAZ: uma chave válida aqui pode não ter sido
 * autorizada.
 */
export const lerChaveDeAcesso = (texto: string): ChaveLida => {
  const chave = limparDocumento(texto);

  if (!FORMATO_CHAVE.test(chave)) {
    const problema =
      chave.length !== 44
        ? `A chave tem ${chave.length} posições; precisa ter 44.`
        : 'A chave tem caracteres fora do lugar: só as posições 7 a 18 (início do CNPJ) aceitam letras.';
    return { valida: false, chave, problemas: [problema], avisos: [], partes: null };
  }

  const partes = separar(chave);
  const problemas: string[] = [];
  const avisos: string[] = [];

  const esperado = calcularDigitoChave(chave.slice(0, 43));
  if (partes.digito !== esperado) {
    problemas.push(`O dígito verificador é ${partes.digito}, mas as outras 43 posições pedem ${esperado}.`);
  }

  if (!partes.uf) problemas.push(`O código de UF ${partes.codigoUf} não existe na tabela do IBGE.`);
  if (partes.mes < 1 || partes.mes > 12) problemas.push(`O mês de emissão (${chave.slice(4, 6)}) não existe.`);

  const documento = partes.emitente.documento;
  if (cnpjValido(documento)) {
    partes.emitente = { tipo: 'cnpj', documento };
  } else if (documento.startsWith('000') && cpfValido(documento.slice(3))) {
    partes.emitente = { tipo: 'cpf', documento: documento.slice(3) };
  } else {
    problemas.push('O documento do emitente dentro da chave não é um CNPJ nem um CPF válido.');
  }

  if (!partes.modelo.sigla) avisos.push(`O modelo ${partes.modelo.codigo} não está na lista de modelos conhecidos.`);
  if (partes.tipoEmissao === '0') avisos.push('O tipo de emissão 0 não existe no leiaute atual.');

  return { valida: problemas.length === 0, chave, problemas, avisos, partes };
};

/** A chave de acesso passa em todas as conferências de `lerChaveDeAcesso`. */
export const chaveDeAcessoValida = (texto: string): boolean => lerChaveDeAcesso(texto).valida;

/** A chave em 11 grupos de 4, como no DANFE, ou null se não tiver 44 posições no formato certo. */
export const formatarChaveDeAcesso = (texto: string): string | null => {
  const chave = limparDocumento(texto);
  if (!FORMATO_CHAVE.test(chave)) return null;
  return chave.match(/.{4}/g)!.join(' ');
};
