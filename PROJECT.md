# Cartão Compartilhado — Definição do Projeto

> Documento gerado via entrevista em 23/05/2026. Atualizar conforme o projeto evoluir.

---

## Visão Geral

Sistema web para controle de uso de cartões de crédito corporativos/compartilhados. Permite registrar qual pessoa usou qual cartão em cada dia e, quando a fatura fechar, importar o arquivo TXT do extrato e gerar automaticamente o rateio de quanto cada pessoa deve pagar.

---

## Stack Tecnológica

| Tecnologia   | Versão      | Observação                              |
|-------------|------------|----------------------------------------|
| Next.js     | 15.2.6     | Server Actions (preferência do projeto) |
| TypeScript  | ^5         |                                        |
| Prisma      | ^7.8.0     | ORM                                    |
| SQLite      | —          | Banco local (aplicação roda em localhost)|
| Zod         | ^4.4.3     | Validação de schemas                   |
| TailwindCSS | ^4         | Estilização                            |

---

## Contexto de Uso

- **Ambiente**: Localhost (uso interno, sem exposição pública)
- **Autenticação**: Nenhuma — qualquer pessoa que acessar a URL pode usar
- **Escala**: Pequena (até 10 pessoas, 1–3 cartões)
- **Dispositivos**: Responsivo — deve funcionar em desktop e celular

---

## Entidades do Sistema

### Pessoa (`Person`)
Campo que a identifica unicamente na base.

| Campo      | Tipo   | Obrigatório | Único | Observação                  |
|-----------|--------|-------------|-------|-----------------------------|
| id        | Int    | Sim         | Sim   | PK auto-incremento          |
| nome      | String | Sim         | Não   | Nome completo               |
| cpf       | String | Sim         | Sim   | CPF — identificador único   |
| email     | String | Não         | Não   | Para futuros envios         |
| telefone  | String | Não         | Não   | WhatsApp/telefone           |
| createdAt | DateTime | Sim       | —     | Auto                        |

### Cartão de Crédito (`CreditCard`)

| Campo          | Tipo   | Obrigatório | Observação                         |
|---------------|--------|-------------|-----------------------------------|
| id            | Int    | Sim         | PK                                |
| nome          | String | Sim         | Ex: "Visa Empresa"                |
| ultimos4      | String | Sim         | Últimos 4 dígitos do cartão       |
| createdAt     | DateTime | Sim       | Auto                              |

### Registro de Uso (`CardUsage`)
Representa "a Pessoa X usou o Cartão Y no dia Z".

| Campo        | Tipo     | Obrigatório | Observação                              |
|-------------|----------|-------------|----------------------------------------|
| id          | Int      | Sim         | PK                                     |
| personId    | Int      | Sim         | FK → Person                            |
| creditCardId| Int      | Sim         | FK → CreditCard                        |
| data        | Date     | Sim         | Dia do uso                             |
| descricao   | String   | Não         | Motivo / descrição do gasto            |
| createdAt   | DateTime | Sim         | Auto                                   |

**Regra de negócio crítica**: Um cartão só pode ter **um registro de uso por dia**. Tentativa de registrar um segundo uso no mesmo dia para o mesmo cartão deve retornar erro de validação.

### Fatura (`Invoice`)
Representa uma importação de extrato TXT.

| Campo        | Tipo     | Obrigatório | Observação                        |
|-------------|----------|-------------|----------------------------------|
| id          | Int      | Sim         | PK                               |
| creditCardId| Int      | Sim         | FK → CreditCard                  |
| nomeArquivo | String   | Sim         | Nome do arquivo importado        |
| importadoEm | DateTime | Sim         | Data/hora da importação          |
| periodoInicio| Date    | Sim         | Menor data encontrada no TXT     |
| periodoFim  | Date     | Sim         | Maior data encontrada no TXT     |

### Transação da Fatura (`InvoiceTransaction`)
Cada linha/lançamento do extrato TXT.

| Campo        | Tipo     | Obrigatório | Observação                                        |
|-------------|----------|-------------|--------------------------------------------------|
| id          | Int      | Sim         | PK                                               |
| invoiceId   | Int      | Sim         | FK → Invoice                                     |
| data        | Date     | Sim         | Data da transação no extrato                     |
| descricao   | String   | Sim         | Descrição da transação conforme extrato          |
| valor       | Decimal  | Sim         | Valor em R$                                      |
| personId    | Int      | Não         | FK → Person (null = não atribuída)               |
| atribuidoManualmente | Boolean | Não  | true se a pessoa foi definida manualmente        |

---

## Fluxos Principais

### 1. Cadastro de Pessoa
- CRUD completo (criar, listar, editar, excluir)
- CPF é o campo único — validação de duplicata obrigatória
- Exclusão deve verificar se há registros de uso vinculados

### 2. Cadastro de Cartão de Crédito
- CRUD completo
- Identificado por nome + últimos 4 dígitos

### 3. Registro de Uso do Cartão
- Selecionar pessoa, cartão e data
- Campo de descrição opcional
- **Validação**: Se já existe um `CardUsage` para o mesmo `creditCardId` + `data`, rejeitar com mensagem clara
- Listar usos por cartão ou por pessoa, filtráveis por período

### 4. Importação de Fatura (TXT)
1. Usuário seleciona o cartão e faz upload do arquivo `.txt`
2. Sistema faz parse do arquivo (formato a ser definido ao analisar o exemplo do arquivo)
3. Para cada transação encontrada:
   - Busca `CardUsage` onde `creditCardId` = cartão selecionado E `data` = data da transação
   - Se encontrar: atribui a transação à pessoa do registro (`personId`)
   - Se não encontrar: salva com `personId = null` (não atribuída)
4. Exibe resultado da importação: total atribuído, total não atribuído, transações sem dono listadas com aviso

### 5. Relatório de Rateio
- Selecionar uma fatura importada
- Exibir tabela: Pessoa → lista de transações → subtotal
- Destacar transações não atribuídas com aviso
- Permitir atribuição manual de transações não atribuídas diretamente no relatório
- Botão "Exportar PDF" para gerar relatório por pessoa (ou consolidado)

---

## Regras de Negócio

1. **Um cartão, uma pessoa por dia**: `(creditCardId, data)` é único em `CardUsage`.
2. **Matching por data**: A associação transação→pessoa é feita exclusivamente pela data.
3. **Transação sem dono**: Não bloqueia a importação; fica marcada como "não atribuída" e aparece com aviso no relatório.
4. **Atribuição manual**: Transações não atribuídas podem ser apontadas para uma pessoa diretamente no relatório.
5. **Histórico completo**: Todas as faturas importadas são mantidas no banco; relatórios de meses anteriores ficam disponíveis.

---

## UI / UX

- **Responsivo**: Mobile-first com TailwindCSS; funcionar bem em telas de 375px até 1440px+
- **Idioma**: Português brasileiro
- **Sem autenticação**: Sem tela de login
- **Navegação**: Sidebar ou bottom navigation mobile

---

## Parser do Arquivo TXT (Banco do Brasil — SISBB)

**Arquivo de exemplo**: `OUROCARD_VISA_INFINITE-Mai_26.txt`  
**Encoding**: Windows-1252 (CP1252) — ler com `encoding: 'latin1'` ou `'cp1252'`  
**Banco**: Banco do Brasil — formato SISBB / Auto-Atendimento

### Estrutura do arquivo

```
[linhas de cabeçalho]
Cliente         : NOME DO CLIENTE
Nr.Cartão       : 4984.****.****.XXXX    ← últimos 4 dígitos na posição final
Modalidade      : OUROCARD VISA INFINITE
Vencimento      : DD.MM.YYYY
Total da fatura : R$ XX.XXX,XX

DEMONSTRATIVO
---...---
Data     Transações                             País        Valor R$   Valor US$
---...---

         1 - NOME DO CLIENTE                   ← titular/portador

         SALDO FATURA ANTERIOR     BR    XX.XXX,XX   (sem data no início)

         Pagamentos/Créditos
DD.MM.YYYYPGTO. CASH AG. ...                   ← pagamento (sem código BR, valor negativo)

         Serviços / Outros lançamentos / Compras parceladas
DD.MM.YYYYDESCRICAO            CIDADE    BR      X.XXX,XX     0,00
DD.MM.YYYYDESC PARC XX/YY CIDADE         BR      X.XXX,XX     0,00   ← parcelada

         SubTotal                                   XX.XXX,XX
         Total                                      XX.XXX,XX
```

### Regras do Parser

**Linha de transação válida** (compra/débito a atribuir):
- Começa com data no formato `DD.MM.YYYY` (10 caracteres)
- Contém o código de país `BR` (ou `US` para compras internacionais) no meio da linha
- Valor R$ positivo

**Linhas a ignorar**:
- Não começam com data → cabeçalho, categorias, separadores
- Começam com data MAS não contêm código de país (`BR`/`US`) → pagamentos (`PGTO.`)
- Linha `SALDO FATURA ANTERIOR` → não começa com data, ignorada automaticamente
- Linhas `SubTotal` e `Total` → sem data

**Regex para captura**:
```
^(\d{2}\.\d{2}\.\d{4})(.+?)\s{2,}(BR|US)\s+([\d.,]+)\s+([\d.,]+)
```
Grupos: `[1]` data · `[2]` descrição+cidade · `[3]` país · `[4]` valor R$ · `[5]` valor US$

**Extração do cabeçalho**:
```
Nr\.Cartão\s+:\s+[\d.]+\.(\d{4})   → últimos 4 dígitos
Cliente\s+:\s+(.+)                  → nome do titular
Vencimento\s+:\s+(\d{2}\.\d{2}\.\d{4})  → data de vencimento
```

### Conversão de valores

Formato brasileiro → número:
```
"1.898,46" → remover "." → "1898,46" → trocar "," por "." → parseFloat("1898.46")
```

### Campos extraídos por transação

| Campo       | Origem                                  |
|------------|----------------------------------------|
| data       | Primeiros 10 chars da linha            |
| descricao  | Entre data e código do país, trimmed   |
| pais       | `BR` ou `US`                           |
| valorBRL   | Coluna "Valor R$"                      |
| valorUSD   | Coluna "Valor US$" (geralmente 0,00)   |

### Compras parceladas

Descrição contém `PARC XX/YY`. Registrar normalmente — o valor já é a parcela do mês, não o total.

---

## Itens Pendentes / A Definir

- [ ] **Formato do PDF exportado**: Definir layout do relatório (por pessoa? consolidado? ambos?).
- [ ] **Nome do projeto/sistema**: Confirmar nome para exibição na interface.
- [ ] **Tratamento de IOF/taxas**: Transações sem data de compra real (IOF vem em linha separada no BB?) — verificar em faturas futuras.

---

## Estrutura de Pastas Sugerida (Next.js App Router)

```
src/
├── app/
│   ├── pessoas/
│   ├── cartoes/
│   ├── usos/
│   ├── faturas/
│   └── relatorios/
├── actions/          # Server Actions
├── components/
├── lib/
│   ├── prisma.ts
│   └── parsers/      # Parser do TXT da fatura
└── schemas/          # Schemas Zod
prisma/
└── schema.prisma
```
