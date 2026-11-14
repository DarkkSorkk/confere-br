const ANTIGA = /^[A-Z]{3}[0-9]{4}$/;
const MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

/** Tira hífen e espaços, e passa para maiúsculas. */
export const limparPlaca = (texto: string): string => texto.toUpperCase().replace(/[\s-]/g, '');

/** 'antiga' (ABC1234), 'mercosul' (ABC1D23) ou null. */
export const tipoDePlaca = (texto: string): 'antiga' | 'mercosul' | null => {
  const placa = limparPlaca(texto);
  if (ANTIGA.test(placa)) return 'antiga';
  if (MERCOSUL.test(placa)) return 'mercosul';
  return null;
};

/** Placa brasileira no formato antigo ou no Mercosul. */
export const placaValida = (texto: string): boolean => tipoDePlaca(texto) !== null;

/**
 * A mesma placa no padrão Mercosul. Na conversão, o segundo número vira letra: 0 = A, 1 = B ... 9 = J
 * (ABC1234 vira ABC1C34). Uma placa Mercosul volta igual; um texto que não é placa volta null.
 */
export const placaParaMercosul = (texto: string): string | null => {
  const placa = limparPlaca(texto);
  if (MERCOSUL.test(placa)) return placa;
  if (!ANTIGA.test(placa)) return null;
  return placa.slice(0, 4) + String.fromCharCode(65 + Number(placa[4])) + placa.slice(5);
};
