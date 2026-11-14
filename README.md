# confere-br

[![ci](https://github.com/DarkkSorkk/confere-br/actions/workflows/ci.yml/badge.svg)](https://github.com/DarkkSorkk/confere-br/actions/workflows/ci.yml)

Confere CNPJ, inclusive o **alfanumérico**, CPF, chave de acesso de NF-e, NFC-e, CT-e e MDF-e e placas de veículo. Em TypeScript, sem nenhuma dependência, roda no Node e no navegador.

> **English:** validation for Brazilian documents: CNPJ (including the new alphanumeric format), CPF, the 44-character access key of electronic invoices (NF-e, CT-e, MDF-e) and vehicle plates. TypeScript, zero dependencies.

## Por que

O CNPJ vai ganhar letras: a Receita Federal prevê o formato alfanumérico a partir de julho de 2026. Todo código que valida CNPJ com `\d{14}` vai recusar as empresas novas. A chave de acesso da NF-e também passa a aceitar letras nas posições do CNPJ (Nota Técnica Conjunta 2025.001).

Esta biblioteca já segue a regra nova:
- cada caractere vale o seu código ASCII menos 48, então A = 17, B = 18 e assim por diante;
- a conta continua em módulo 11;
- por isso, os CNPJs só com números continuam válidos do mesmo jeito.

## Instalação

Ainda não está no npm. Por enquanto, instale pelo GitHub:

```bash
npm install github:DarkkSorkk/confere-br#v0.1.0
```

## Uso

```ts
import {
  cnpjValido, cpfValido, calcularDigitosCnpj, formatarCnpj,
  lerChaveDeAcesso, placaParaMercosul,
} from 'confere-br';

cnpjValido('12.ABC.345/01DE-35');    // true  (alfanumérico)
cnpjValido('11.222.333/0001-81');    // true  (só números, como sempre)
calcularDigitosCnpj('12ABC34501DE'); // '35'
formatarCnpj('12abc34501de35');      // '12.ABC.345/01DE-35'
cpfValido('529.982.247-25');         // true

placaParaMercosul('ABC-1234');       // 'ABC1C34'

const chave = lerChaveDeAcesso('3526 1111 2223 3300 0181 5500 1000 0012 3411 2345 6780');
// {
//   valida: true,
//   problemas: [],
//   avisos: [],
//   partes: {
//     codigoUf: '35', uf: 'SP', ano: 2026, mes: 11,
//     emitente: { tipo: 'cnpj', documento: '11222333000181' },
//     modelo: { codigo: '55', sigla: 'NF-e', nome: 'Nota Fiscal Eletrônica' },
//     serie: '001', numero: '000001234', tipoEmissao: '1', codigoNumerico: '12345678', digito: '0'
//   },
//   ...
// }
```

Quando a chave não vale, `problemas` diz o motivo numa frase pronta para mostrar a quem digitou, por exemplo: "O dígito verificador é 9, mas as outras 43 posições pedem 0."

## O que tem

| Função | O que faz |
|---|---|
| `cnpjValido`, `cpfValido`, `documentoValido` | Conferem os dígitos, com ou sem pontuação. Recusam sequências repetidas (000.000.000-00). |
| `calcularDigitosCnpj`, `calcularDigitosCpf` | Os 2 dígitos a partir da base (12 caracteres no CNPJ, 9 números no CPF). |
| `formatarCnpj`, `formatarCpf`, `tipoDeDocumento`, `limparDocumento` | Pontuação e tipo pelo formato. A formatação devolve `null` quando o texto não tem o formato do documento. |
| `gerarCnpj({ alfanumerico })`, `gerarCpf` | Documentos válidos ao acaso, **para testes**. Podem coincidir por acaso com um documento real. |
| `lerChaveDeAcesso`, `chaveDeAcessoValida` | Leem e conferem a chave de 44 posições (veja abaixo). Aceitam a chave com espaços, como sai no DANFE. |
| `calcularDigitoChave`, `formatarChaveDeAcesso` | O dígito a partir das 43 primeiras posições, e a chave em 11 grupos de 4. |
| `placaValida`, `tipoDePlaca`, `placaParaMercosul` | Placas no formato antigo (ABC1234) e no Mercosul (ABC1D23), e a conversão de uma para a outra. |

## Chave de acesso: o que é conferido

| Posições | Campo | Conferência |
|---|---|---|
| 1–2 | UF do emitente | O código existe na tabela do IBGE. |
| 3–6 | Ano e mês de emissão | O mês vai de 01 a 12. |
| 7–20 | CNPJ do emitente | Os dígitos do CNPJ fecham, inclusive no alfanumérico. Para pessoa física, vale o CPF com 3 zeros à esquerda. |
| 21–22 | Modelo | 55 NF-e, 65 NFC-e, 57 CT-e, 67 CT-e OS, 58 MDF-e, 63 BP-e, 66 NF3e e 62 NFCom. Outro código vira **aviso**, não problema. |
| 23–25, 26–34 | Série e número | Só números. |
| 35 | Tipo de emissão | 0 vira aviso: não existe no leiaute atual. |
| 36–43 | Código numérico | Só números. |
| 44 | Dígito verificador | Módulo 11 sobre as outras 43 posições. |

## O que não faz

- **Não consulta a SEFAZ.** Uma chave válida aqui pode não ter sido autorizada. Para saber se a nota existe, consulte o portal ou o webservice da SEFAZ.
- **Não diz se o CNPJ existe** ou está ativo na Receita. Diz só se os dígitos fecham.
- **Aceita qualquer letra de A a Z** nas 12 primeiras posições do CNPJ. Alguns resumos da norma citam a exclusão de certas letras, mas a regra de cálculo publicada não exclui nenhuma.

## Testes

```bash
npm install
npm test
```

São 34 testes com o `node:test`, sem nenhuma biblioteca de teste. Entre eles estão o exemplo de CNPJ alfanumérico da Receita (12.ABC.345/01DE-35) e o exemplo de dígito da chave do Manual de Orientação do Contribuinte da NF-e.

O CI roda no Node 22 e no 24, a cada envio:
- confere os tipos;
- roda os testes e o build;
- confere o pacote que iria para o npm;
- passa o [Trivy](https://trivy.dev) atrás de vulnerabilidades e segredos.

## Em produção

A mesma conferência roda na [amostra de leitura de nota fiscal da EasyIA](https://easyia.org/amostra/nota-fiscal). A IA lê o DANFE, e o código confere a chave de acesso, o CNPJ, as somas e as datas.

## Fontes

- Receita Federal: [perguntas e respostas sobre o CNPJ alfanumérico](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/cnpj/cnpj-alfanumerico.pdf).
- Nota Técnica Conjunta 2025.001, do Portal da Nota Fiscal Eletrônica: CNPJ alfanumérico nos documentos fiscais eletrônicos.
- Manual de Orientação do Contribuinte da NF-e: leiaute e cálculo do dígito da chave de acesso.

## Autor

Allan Felipe Silva, fundador da [EasyIA](https://easyia.org). Desenvolvimento assistido por IA (Claude Code), com revisão e testes.

Licença [MIT](LICENSE).
