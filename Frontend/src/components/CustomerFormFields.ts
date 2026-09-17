import type { EditorField } from './MockEditor'
import type { Cliente, ClienteInput, Endereco, EnderecoInput, Cartao } from '../services/clienteService'

export function personalFields(cliente?: Cliente): EditorField[] {
  return [
    { name: 'nome', label: 'Nome completo', value: cliente?.nome ?? '', maxLength: 150 },
    { name: 'genero', label: 'Gênero', value: cliente?.genero ?? '', type: 'select', options: ['', 'Masculino', 'Feminino', 'Não binário', 'Outro', 'Prefiro não informar'] },
    { name: 'cpf', label: 'CPF', value: cliente?.cpf ?? '', maxLength: 14 },
    { name: 'email', label: 'E-mail', value: cliente?.email ?? '', type: 'email', maxLength: 254 },
    { name: 'dataNascimento', label: 'Data de nascimento', value: cliente?.dataNascimento ?? '', type: 'date' },
    { name: 'tipoTelefone', label: 'Tipo de telefone', value: cliente?.tipoTelefone ?? '', type: 'select', options: ['', 'Celular', 'Residencial', 'Comercial'] },
    { name: 'ddd', label: 'DDD', value: cliente?.ddd ?? '', maxLength: 2 },
    { name: 'telefone', label: 'Telefone sem DDD', value: cliente?.telefone ?? '', maxLength: 9 },
  ].map(f => ({ ...f, required: true })) as EditorField[]
}
export const passwordFields: EditorField[] = [
  { name: 'senha', label: 'Senha', type: 'password', required: true },
  { name: 'confirmacaoSenha', label: 'Confirmar senha', type: 'password', required: true },
]
export function validatePassword(values: Record<string, string>) {
  if (values.senha.length < 8 || !/[A-Z]/.test(values.senha) || !/[a-z]/.test(values.senha) || !/[^a-zA-Z0-9\s]/.test(values.senha))
    throw new Error('Senha deve ter pelo menos 8 caracteres, maiúscula, minúscula e caractere especial.')
  if (values.senha !== values.confirmacaoSenha) throw new Error('A confirmação de senha não confere.')
}
export function addressFields(endereco?: Endereco, initial = false): EditorField[] {
  const fields: EditorField[] = [
    { name: 'enderecoNome', label: 'Identificação do endereço', value: endereco?.nome ?? '', maxLength: 60 },
    { name: 'tipoResidencia', label: 'Tipo de residência', value: endereco?.tipoResidencia ?? '', type: 'select', options: ['', 'Casa', 'Apartamento', 'Outro'] },
    { name: 'tipoLogradouro', label: 'Tipo de logradouro', value: endereco?.tipoLogradouro ?? '', type: 'select', options: ['', 'Rua', 'Avenida', 'Alameda', 'Travessa', 'Estrada', 'Outro'] },
    { name: 'logradouro', label: 'Logradouro', value: endereco?.logradouro ?? '', maxLength: 150 },
    { name: 'numero', label: 'Número', value: endereco?.numero ?? '', maxLength: 20 },
    { name: 'bairro', label: 'Bairro', value: endereco?.bairro ?? '', maxLength: 100 },
    { name: 'cep', label: 'CEP', value: endereco?.cep ?? '', maxLength: 9 },
    { name: 'cidade', label: 'Cidade', value: endereco?.cidade ?? '', maxLength: 100 },
    { name: 'estado', label: 'Estado (UF)', value: endereco?.estado ?? '', maxLength: 2 },
    { name: 'pais', label: 'País', value: endereco?.pais ?? '', maxLength: 60 },
  ].map(f => ({ ...f, required: true })) as EditorField[]
  return [...fields,
    { name: 'observacoes', label: 'Observações do endereço', value: endereco?.observacoes ?? '', type: 'textarea', maxLength: 500 },
    { name: 'residencial', label: 'Endereço residencial', value: String(endereco?.residencial ?? initial), type: 'checkbox' },
    { name: 'entrega', label: 'Endereço de entrega', value: String(endereco?.entrega ?? initial), type: 'checkbox' },
    { name: 'cobranca', label: 'Endereço de cobrança', value: String(endereco?.cobranca ?? initial), type: 'checkbox' },
  ]
}
export function addressInput(v: Record<string, string>): EnderecoInput {
  return {
    nome: v.enderecoNome.trim(), tipoResidencia: v.tipoResidencia, tipoLogradouro: v.tipoLogradouro,
    logradouro: v.logradouro.trim(), numero: v.numero.trim(), bairro: v.bairro.trim(), cep: v.cep.replace(/\D/g, ''),
    cidade: v.cidade.trim(), estado: v.estado.toUpperCase(), pais: v.pais.trim(), observacoes: v.observacoes,
    residencial: v.residencial === 'true', entrega: v.entrega === 'true', cobranca: v.cobranca === 'true',
  }
}
export function customerInput(v: Record<string, string>, registration = false): ClienteInput {
  const data: ClienteInput = {
    nome: v.nome.trim(), genero: v.genero, cpf: v.cpf.replace(/[.\-\s]/g, ''), email: v.email.trim(),
    dataNascimento: v.dataNascimento, tipoTelefone: v.tipoTelefone, ddd: v.ddd, telefone: v.telefone,
  }
  if (registration) {
    validatePassword(v)
    data.senha = v.senha; data.confirmacaoSenha = v.confirmacaoSenha; data.enderecos = [addressInput(v)]
  }
  return data
}
export function cardFields(bandeiras: string[], cartao?: Cartao): EditorField[] {
  return [
    { name: 'bandeira', label: 'Bandeira', value: cartao?.bandeira ?? '', type: 'select', options: ['', ...bandeiras], required: true },
    { name: 'titular', label: 'Nome impresso no cartão', value: cartao?.titular ?? '', required: true, maxLength: 150 },
    { name: 'validade', label: 'Validade (MM/AA)', value: cartao?.validade ?? '', required: true, maxLength: 5 },
    ...(!cartao ? [
      { name: 'numeroCartao', label: 'Número do cartão', type: 'password', required: true, maxLength: 23 } as EditorField,
      { name: 'codigoSeguranca', label: 'Código de segurança', type: 'password', required: true, maxLength: 4 } as EditorField,
    ] : []),
    { name: 'preferencial', label: 'Cartão preferencial', type: 'checkbox', value: String(cartao?.preferencial ?? false) },
  ]
}
