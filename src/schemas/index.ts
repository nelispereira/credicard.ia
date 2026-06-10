import { z } from "zod";

export const pessoaSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  cpf: z
    .string()
    .regex(/^\d{11}$/, "CPF deve conter 11 dígitos numéricos"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
});

export const cartaoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  ultimos4: z
    .string()
    .regex(/^\d{4}$/, "Informe os 4 últimos dígitos do cartão"),
  diaVencimento: z.coerce.number().int().min(1).max(28).default(5),
});

export const usoCartaoSchema = z.object({
  personId: z.coerce.number().int().positive(),
  creditCardId: z.coerce.number().int().positive(),
  data: z.coerce.date(),
  descricao: z.string().optional(),
});

export const atribuirTransacaoSchema = z.object({
  transactionId: z.coerce.number().int().positive(),
  personId: z.coerce.number().int().positive(),
});

export const categoriaGastoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida").optional().or(z.literal("")),
});

export const gastoSchema = z
  .object({
    categoriaId: z.coerce.number().int().positive("Selecione uma categoria"),
    descricao: z.string().min(2, "Descrição deve ter ao menos 2 caracteres"),
    valorTotal: z.coerce.number().positive("Informe um valor maior que zero"),
    tipo: z.enum(["UNICO", "RECORRENTE", "PARCELADO"]),
    dataInicio: z.coerce.date(),
    dataFim: z.coerce.date().optional().nullable(),
    numeroParcelas: z.coerce.number().int().min(2, "Mínimo de 2 parcelas").optional().nullable(),
  })
  .refine(
    (d) => d.tipo !== "PARCELADO" || (d.numeroParcelas != null && d.numeroParcelas >= 2),
    { message: "Informe o número de parcelas (mínimo 2)", path: ["numeroParcelas"] }
  );

export type PessoaInput = z.infer<typeof pessoaSchema>;
export type CartaoInput = z.infer<typeof cartaoSchema>;
export type UsoCartaoInput = z.infer<typeof usoCartaoSchema>;
export type AtribuirTransacaoInput = z.infer<typeof atribuirTransacaoSchema>;
export type CategoriaGastoInput = z.infer<typeof categoriaGastoSchema>;
export type GastoInput = z.infer<typeof gastoSchema>;
