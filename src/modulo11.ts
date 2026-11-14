// Cada caractere vale o código ASCII menos 48. Os números valem o mesmo de sempre, e as letras do CNPJ
// alfanumérico continuam a sequência: A = 17, B = 18 ... Z = 42. A chave de acesso usa a mesma conversão
// (Nota Técnica Conjunta 2025.001). Por isso os CNPJs e chaves só com números não mudam.
export const valorDoCaractere = (caractere: string): number => caractere.charCodeAt(0) - 48;

/**
 * Dígito verificador em módulo 11.
 *
 * Os pesos vão de 2 até `pesoMaximo`, da direita para a esquerda, e recomeçam em 2 depois do máximo.
 * CNPJ e chave de acesso usam 9; o CPF usa 11 (a base nunca passa disso, então não recomeça).
 * Resto 0 ou 1 vira dígito 0.
 */
export const digitoModulo11 = (base: string, pesoMaximo = 9): number => {
  let soma = 0;
  let peso = 2;
  for (let i = base.length - 1; i >= 0; i--) {
    soma += valorDoCaractere(base[i]!) * peso;
    peso = peso === pesoMaximo ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
};
