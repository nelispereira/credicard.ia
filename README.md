# Credicard.ia

Sistema web para controle e rateio de cartões de crédito compartilhados. Permite registrar quem usou qual cartão em cada dia e, ao importar a fatura do Banco do Brasil (formato SISBB), gera automaticamente o rateio de quanto cada pessoa deve pagar.

## Funcionalidades

- **Pessoas** — CRUD de usuários do cartão, identificados por CPF
- **Cartões** — cadastro de cartões de crédito por nome e últimos 4 dígitos
- **Registros de uso** — quem usou qual cartão em cada dia (um uso por cartão/dia)
- **Importação de fatura** — upload do extrato TXT do Banco do Brasil (Ourocard VISA Infinite / SISBB)
- **Rateio automático** — cada transação é vinculada à pessoa pelo matching de data
- **Atribuição manual** — transações sem dono podem ser atribuídas diretamente no relatório
- **Exportação** — relatório de fatura em PDF por pessoa ou consolidado

## Stack

| Tecnologia  | Versão  |
|-------------|---------|
| Next.js     | 16.2.6  |
| TypeScript  | ^6      |
| Prisma      | ^7.8.0  |
| SQLite      | —       |
| Zod         | ^4.4.3  |
| TailwindCSS | ^4      |

## Pré-requisitos

- Node.js 20+
- npm

## Instalação

```bash
npm install
npx prisma migrate dev
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Banco de dados

O projeto usa SQLite local (`dev.db`). O schema fica em `prisma/schema.prisma` e as migrations em `prisma/migrations/`.

## Fluxo de uso

1. Cadastre as **pessoas** que compartilham o cartão
2. Cadastre os **cartões** de crédito
3. A cada dia de uso, registre em **Usos** quem usou qual cartão
4. No fechamento da fatura, acesse **Faturas** e importe o arquivo `.txt` do Banco do Brasil
5. O sistema faz o matching automático transação→pessoa por data e exibe o rateio
6. Transações sem correspondência ficam marcadas como "não atribuídas" e podem ser atribuídas manualmente

## Estrutura do projeto

```
src/
├── app/
│   ├── cartoes/       # Cadastro de cartões
│   ├── faturas/       # Importação e relatório de faturas
│   ├── pessoas/       # Cadastro de pessoas
│   └── usos/          # Registro de uso diário
├── actions/           # Server Actions (Next.js)
├── components/        # Componentes compartilhados
├── lib/
│   ├── parsers/       # Parser do TXT do Banco do Brasil
│   └── prisma.ts
└── schemas/           # Validações Zod
prisma/
└── schema.prisma
```

## Contexto

- Uso interno em localhost — sem autenticação
- Pensado para pequenos grupos (até ~10 pessoas, 1–3 cartões)
- Parser compatível com o formato SISBB do Banco do Brasil (encoding CP1252)
