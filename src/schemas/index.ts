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

export type PessoaInput = z.infer<typeof pessoaSchema>;
export type CartaoInput = z.infer<typeof cartaoSchema>;
export type UsoCartaoInput = z.infer<typeof usoCartaoSchema>;
export type AtribuirTransacaoInput = z.infer<typeof atribuirTransacaoSchema>;
