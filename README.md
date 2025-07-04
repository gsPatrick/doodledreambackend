# Sistema de E-commerce - Documentação de API

## Índice

1. [Autenticação](#autenticação)
2. [Usuários](#usuários)
3. [Produtos](#produtos)
4. [Categorias](#categorias)
5. [Avaliações](#avaliações)
6. [Pedidos](#pedidos)
7. [Pagamentos](#pagamentos)
8. [Carrinho](#carrinho)
9. [Cupons](#cupons)
10. [Fretes](#fretes)
11. [Endereços](#endereços)
12. [Favoritos](#favoritos)
13. [Uploads](#uploads)
14. [Relatórios](#relatórios)
15. [Blog](#blog)
16. [Downloads](#downloads)
17. [Dashboard](#dashboard)
18. [Configurações da Loja](#configurações-da-loja)
19. [CEP](#cep)

## Autenticação

### Login

```
POST /api/auth/login
```

**Payload:**
```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "Usuário Exemplo",
    "email": "usuario@exemplo.com",
    "tipo": "cliente"
  }
}
```

### Login com Google

```
POST /api/auth/google
```

**Payload:**
```json
{
  "googleToken": "token_do_google"
}
```

### Registro

```
POST /api/auth/register
```

**Payload:**
```json
{
  "nome": "Novo Usuário",
  "email": "novo@exemplo.com",
  "senha": "senha123"
}
```

### Recuperar Senha

```
POST /api/auth/recuperar-senha
```

**Payload:**
```json
{
  "email": "usuario@exemplo.com"
}
```

**Resposta:**
```json
{
  "message": "Email de recuperação enviado"
}
```

### Alterar Senha (com token de recuperação)

```
POST /api/auth/alterar-senha
```

**Payload:**
```json
{
  "token": "token_de_recuperacao",
  "novaSenha": "nova_senha123"
}
```

**Resposta:**
```json
{
  "message": "Senha alterada com sucesso"
}
```

## Usuários

### Obter Perfil do Usuário Logado

```
GET /api/usuarios/perfil
```

**Resposta:**
```json
{
  "id": 1,
  "nome": "Usuário Exemplo",
  "email": "usuario@exemplo.com",
  "tipo": "cliente",
  "telefone": "11999999999",
  "dataCriacao": "2023-01-01T00:00:00Z"
}
```

### Atualizar Perfil do Usuário Logado

```
PUT /api/usuarios/perfil
```

**Payload:**
```json
{
  "nome": "Nome Atualizado",
  "email": "atualizado@exemplo.com",
  "senhaAtual": "senha_atual",
  "novaSenha": "nova_senha"
}
```

### Listar Usuários (Admin)

```
GET /api/usuarios
```

**Parâmetros de consulta:**
- `pagina` - Número da página (padrão: 1)
- `limite` - Itens por página (padrão: 10)
- `busca` - Termo para busca
- `tipo` - Filtrar por tipo (admin, cliente)

### Obter Usuário por ID (Admin)

```
GET /api/usuarios/:id
```

### Atualizar Usuário (Admin)

```
PUT /api/usuarios/:id
```

**Payload:**
```json
{
  "nome": "Nome Atualizado",
  "email": "atualizado@exemplo.com",
  "tipo": "admin",
  "ativo": true,
  "novaSenha": "nova_senha"
}
```

### Excluir Usuário (Admin)

```
DELETE /api/usuarios/:id
```

## Produtos

### Listar Produtos

```
GET /api/produtos
```

**Parâmetros de consulta:**
- `pagina` - Número da página (padrão: 1)
- `limite` - Itens por página (padrão: 10)
- `ordenar` - Campo para ordenação (padrão: id)
- `direcao` - Direção da ordenação (asc/desc)
- `categoria` - Filtrar por categoria
- `busca` - Termo de busca

### Obter Produto

```
GET /api/produtos/:id
```

### Listar Produtos Relacionados

```
GET /api/produtos/:id/relacionados
```

**Parâmetros de consulta:**
- `limite` - Número máximo de produtos relacionados (padrão: 4)

### Criar Produto (Admin)

```
POST /api/produtos
```

**Payload:**
```json
{
  "nome": "Novo Produto",
  "descricao": "Descrição do produto",
  "preco": 99.90,
  "categoriaId": 1,
  "estoque": 100,
  "ativo": true,
  "destaque": false
}
```

### Atualizar Produto (Admin)

```
PUT /api/produtos/:id
```

### Remover Produto (Admin)

```
DELETE /api/produtos/:id
```

### Definir Produtos Relacionados (Admin)

```
POST /api/produtos/:id/relacionados
```

**Payload:**
```json
{
  "produtosRelacionados": [2, 3, 4]
}
```

### Upload de Arquivo para Produto (Admin)

```
POST /api/produtos/:id/arquivos
```

### Download de Arquivos de Produto Comprado

```
GET /api/produtos/:id/arquivos/download
```

## Categorias

### Listar Categorias

```
GET /api/categorias
```

### Obter Categoria

```
GET /api/categorias/:id
```

### Criar Categoria (Admin)

```
POST /api/categorias
```

**Payload:**
```json
{
  "nome": "Nova Categoria",
  "descricao": "Descrição da categoria",
  "ativo": true
}
```

### Atualizar Categoria (Admin)

```
PUT /api/categorias/:id
```

### Remover Categoria (Admin)

```
DELETE /api/categorias/:id
```

## Avaliações

### Listar Avaliações de Produto

```
GET /api/produtos/:produtoId/avaliacoes
```

### Obter Média de Avaliações

```
GET /api/produtos/:produtoId/avaliacoes/media
```

### Criar Avaliação

```
POST /api/produtos/:produtoId/avaliacoes
```

**Payload:**
```json
{
  "titulo": "Excelente produto",
  "comentario": "Superou minhas expectativas",
  "estrelas": 5
}
```

### Listar Minhas Avaliações

```
GET /api/avaliacoes/minhas
```

### Obter Avaliação

```
GET /api/avaliacoes/:id
```

### Atualizar Avaliação

```
PUT /api/avaliacoes/:id
```

### Remover Avaliação

```
DELETE /api/avaliacoes/:id
```

### Listar Avaliações Pendentes (Admin)

```
GET /api/avaliacoes/admin/pendentes
```

### Aprovar Avaliação (Admin)

```
POST /api/avaliacoes/:id/aprovar
```

## Pedidos

### Listar Meus Pedidos

```
GET /api/pedidos
```

### Obter Pedido

```
GET /api/pedidos/:id
```

### Criar Pedido

```
POST /api/pedidos
```

**Payload:**
```json
{
  "enderecoEntregaId": 1,
  "freteId": "1",
  "cupomCodigo": "BEMVINDO10"
}
```

### Atualizar Status do Pedido (Admin)

```
PUT /api/pedidos/:id/status
```

**Payload:**
```json
{
  "status": "em_processamento"
}
```

### Cancelar Pedido

```
DELETE /api/pedidos/:id
```

## Pagamentos

### Webhook do Mercado Pago

```
POST /api/pagamentos/webhook
```

### Criar Checkout

```
POST /api/pagamentos/checkout
```

**Payload:**
```json
{
  "pedidoId": 1
}
```

### Verificar Status do Pagamento

```
GET /api/pagamentos/status/:pedidoId
```

### Listar Pagamentos

```
GET /api/pagamentos
```

## Carrinho

### Obter Carrinho

```
GET /api/carrinho
```

### Adicionar ao Carrinho

```
POST /api/carrinho/adicionar
```

**Payload:**
```json
{
  "produtoId": 1,
  "quantidade": 2
}
```

### Atualizar Carrinho

```
PUT /api/carrinho/atualizar
```

**Payload:**
```json
{
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 3
    }
  ]
}
```

### Remover do Carrinho

```
DELETE /api/carrinho/remover
```

**Payload:**
```json
{
  "produtoId": 1
}
```

### Limpar Carrinho

```
DELETE /api/carrinho/limpar
```

## Cupons

### Validar Cupom

```
POST /api/cupons/validar
```

**Payload:**
```json
{
  "codigo": "BEMVINDO10"
}
```

### Aplicar Cupom

```
POST /api/cupons/aplicar
```

**Payload:**
```json
{
  "codigo": "BEMVINDO10",
  "total": 100.00
}
```

### Listar Cupons (Admin)

```
GET /api/cupons
```

### Obter Cupom (Admin)

```
GET /api/cupons/:id
```

### Criar Cupom (Admin)

```
POST /api/cupons
```

**Payload:**
```json
{
  "codigo": "BEMVINDO10",
  "valor": 10,
  "tipo": "percentual",
  "validade": "2023-12-31T23:59:59Z",
  "usoMaximo": 100
}
```

### Atualizar Cupom (Admin)

```
PUT /api/cupons/:id
```

### Excluir Cupom (Admin)

```
DELETE /api/cupons/:id
```

## Fretes

### Calcular Frete

```
POST /api/frete/calcular
```

**Payload:**
```json
{
  "enderecoOrigem": {
    "cep": "01001000"
  },
  "enderecoDestino": {
    "cep": "04538132"
  },
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 1
    }
  ]
}
```

### Rastrear Entrega

```
GET /api/frete/rastrear/:codigoRastreio
```

### Listar Métodos de Frete

```
GET /api/frete/metodos
```

### Obter Método de Frete

```
GET /api/frete/metodos/:id
```

### Criar Método de Frete (Admin)

```
POST /api/frete/metodos
```

### Atualizar Método de Frete (Admin)

```
PUT /api/frete/metodos/:id
```

### Remover Método de Frete (Admin)

```
DELETE /api/frete/metodos/:id
```

### Gerar Etiqueta (Admin)

```
POST /api/frete/gerar-etiqueta
```

### Cancelar Etiqueta (Admin)

```
POST /api/frete/cancelar-etiqueta
```

## Endereços

### Validar CEP

```
POST /api/enderecos/validar-cep
```

**Payload:**
```json
{
  "cep": "01001000"
}
```

**Resposta:**
```json
{
  "cep": "01001-000",
  "logradouro": "Praça da Sé",
  "complemento": "lado ímpar",
  "bairro": "Sé",
  "cidade": "São Paulo",
  "estado": "SP"
}
```

### Listar Endereços

```
GET /api/enderecos
```

### Obter Endereço Principal

```
GET /api/enderecos/principal
```

### Obter Endereço

```
GET /api/enderecos/:id
```

### Criar Endereço

```
POST /api/enderecos
```

**Payload:**
```json
{
  "cep": "01001000",
  "logradouro": "Praça da Sé",
  "numero": "1",
  "complemento": "Apto 123",
  "bairro": "Sé",
  "cidade": "São Paulo",
  "estado": "SP",
  "destinatario": "Nome do Destinatário",
  "telefone": "11999999999"
}
```

### Atualizar Endereço

```
PUT /api/enderecos/:id
```

### Remover Endereço

```
DELETE /api/enderecos/:id
```

### Definir Endereço como Padrão

```
PATCH /api/enderecos/:id/padrao
```

### Definir Endereço como Principal

```
POST /api/enderecos/:id/principal
```

## Favoritos

### Listar Favoritos

```
GET /api/favoritos
```

### Adicionar aos Favoritos

```
POST /api/favoritos
```

**Payload:**
```json
{
  "produtoId": 1
}
```

### Remover dos Favoritos

```
DELETE /api/favoritos/:produtoId
```

### Verificar se Produto está nos Favoritos

```
GET /api/favoritos/verificar/:produtoId
```

### Contar Favoritos

```
GET /api/favoritos/contar
```

## Uploads

### Upload de Imagem

```
POST /api/uploads/imagem
```

**Payload:**
```json
{
  "imagem": "[arquivo de imagem]"
}
```

### Upload de Múltiplas Imagens

```
POST /api/uploads/imagens
```

**Payload:**
```json
{
  "imagens": "[arquivos de imagem]"
}
```

### Upload de Imagem para Produto

```
POST /api/uploads/produto/:produtoId/imagem
```

**Payload:**
```json
{
  "imagem": "[arquivo de imagem]"
}
```

### Upload de Arquivo para Produto

```
POST /api/uploads/produto/:produtoId/arquivo
```

**Payload:**
```json
{
  "arquivo": "[arquivo]"
}
```

### Otimizar Imagem

```
POST /api/uploads/otimizar
```

**Payload:**
```json
{
  "imagem": "[arquivo de imagem]",
  "largura": 800,
  "altura": 600,
  "qualidade": 80
}
```

### Obter Informações de Imagem

```
GET /api/uploads/info/:caminho
```

### Remover Arquivo

```
DELETE /api/uploads/arquivo
```

**Payload:**
```json
{
  "caminho": "uploads/arquivo.jpg"
}
```

### Listar Arquivos

```
GET /api/uploads/listar/:diretorio?
```

### Upload de Imagem para Produto (Nova Versão)

```
POST /api/upload/produtos/:produtoId/imagem
```

### Upload de Múltiplas Imagens para Produto (Nova Versão)

```
POST /api/upload/produtos/:produtoId/imagens
```

### Upload de Arquivo para Produto (Nova Versão)

```
POST /api/upload/produtos/:produtoId/arquivo
```

### Definir Imagem Principal

```
PUT /api/upload/produtos/:produtoId/imagens/:arquivoId/principal
```

### Excluir Arquivo

```
DELETE /api/upload/produtos/:produtoId/arquivos/:arquivoId
```

## Relatórios

### Vendas por Período (Admin)

```
GET /api/relatorios/vendas?dataInicio=2023-01-01&dataFim=2023-01-31
```

### Produtos Mais Vendidos (Admin)

```
GET /api/relatorios/produtos-mais-vendidos?periodo=30&limite=10
```

### Desempenho de Cupons (Admin)

```
GET /api/relatorios/desempenho-cupons
```

### Clientes Mais Ativos (Admin)

```
GET /api/relatorios/clientes-ativos?limite=10
```

## Blog

### Listar Posts Públicos

```
GET /api/blog
```

**Parâmetros de consulta:**
- `pagina` - Número da página (padrão: 1)
- `limite` - Itens por página (padrão: 10)
- `categoria` - Filtrar por categoria

**Resposta:**
```json
{
  "posts": [
    {
      "id": 1,
      "titulo": "Título do Post",
      "slug": "titulo-do-post",
      "resumo": "Resumo do post",
      "imagem": "/uploads/blog/imagem-post.jpg",
      "dataCriacao": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "paginas": 1,
  "paginaAtual": 1
}
```

### Buscar Post por Slug

```
GET /api/blog/:slug
```

**Resposta:**
```json
{
  "id": 1,
  "titulo": "Título do Post",
  "slug": "titulo-do-post",
  "conteudo": "Conteúdo completo do post...",
  "imagem": "/uploads/blog/imagem-post.jpg",
  "autor": {
    "id": 1,
    "nome": "Admin"
  },
  "dataCriacao": "2023-01-01T00:00:00Z",
  "categorias": ["Categoria 1", "Categoria 2"]
}
```

### Listar Todos os Posts (Admin)

```
GET /api/blog/admin/todos
```

**Parâmetros de consulta:**
- `pagina` - Número da página (padrão: 1)
- `limite` - Itens por página (padrão: 10)
- `status` - Filtrar por status (rascunho, publicado, pendente)

**Resposta:**
```json
{
  "posts": [
    {
      "id": 1,
      "titulo": "Título do Post",
      "slug": "titulo-do-post",
      "status": "publicado",
      "autor": {
        "id": 1,
        "nome": "Admin"
      },
      "dataCriacao": "2023-01-01T00:00:00Z",
      "dataAtualizacao": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "paginas": 1,
  "paginaAtual": 1
}
```

### Criar Post (Admin)

```
POST /api/blog
```

**Payload:**
```json
{
  "titulo": "Novo Post",
  "conteudo": "Conteúdo do post...",
  "resumo": "Resumo do post",
  "categorias": [1, 2],
  "status": "rascunho",
  "imagemDestaque": "base64..."
}
```

**Resposta:**
```json
{
  "id": 2,
  "titulo": "Novo Post",
  "slug": "novo-post",
  "status": "rascunho",
  "mensagem": "Post criado com sucesso"
}
```

### Atualizar Post (Admin)

```
PUT /api/blog/:id
```

**Payload:**
```json
{
  "titulo": "Post Atualizado",
  "conteudo": "Conteúdo atualizado...",
  "resumo": "Resumo atualizado",
  "categorias": [1, 3],
  "status": "publicado"
}
```

### Aprovar Post (Admin)

```
POST /api/blog/:id/aprovar
```

**Resposta:**
```json
{
  "id": 2,
  "status": "publicado",
  "mensagem": "Post aprovado com sucesso"
}
```

## Downloads

### Listar Produtos Pagos com Downloads

```
GET /api/downloads/produtos-pagos
```

**Resposta:**
```json
[
  {
    "id": 1,
    "nome": "Produto Digital",
    "pedidoId": 5,
    "arquivos": [
      {
        "id": 1,
        "nome": "manual.pdf",
        "tipo": "pdf",
        "tamanho": 1024000
      }
    ]
  }
]
```

### Baixar Arquivo

```
GET /api/downloads/arquivo/:produtoId/:arquivoId
```

## Dashboard

### Obter Métricas (Admin)

```
GET /api/dashboard/metricas
```

**Resposta:**
```json
{
  "vendasHoje": 5,
  "vendasTotal": 120,
  "faturamentoHoje": 500.00,
  "faturamentoTotal": 12000.00,
  "clientesTotal": 50,
  "produtosTotal": 30,
  "taxaConversao": 3.5
}
```

### Obter Vendas por Período (Admin)

```
GET /api/dashboard/vendas
```

**Parâmetros de consulta:**
- `periodo` - Período em dias (padrão: 30)
- `agrupamento` - Como agrupar os dados (dia, semana, mes)

**Resposta:**
```json
{
  "labels": ["01/01", "02/01", "03/01"],
  "vendas": [5, 3, 7],
  "faturamento": [500.00, 300.00, 700.00]
}
```

### Obter Produtos Mais Vendidos (Admin)

```
GET /api/dashboard/produtos-mais-vendidos
```

**Parâmetros de consulta:**
- `limite` - Número de produtos (padrão: 5)
- `periodo` - Período em dias (padrão: 30)

**Resposta:**
```json
[
  {
    "id": 1,
    "nome": "Produto Popular",
    "quantidade": 20,
    "faturamento": 1990.00
  }
]
```

### Obter Clientes Top (Admin)

```
GET /api/dashboard/clientes-top
```

**Parâmetros de consulta:**
- `limite` - Número de clientes (padrão: 5)

**Resposta:**
```json
[
  {
    "id": 1,
    "nome": "Cliente Fiel",
    "email": "cliente@exemplo.com",
    "pedidos": 10,
    "valorTotal": 1500.00
  }
]
```

## Configurações da Loja

### Obter Configurações Públicas

```
GET /api/configuracoes/publicas
```

**Resposta:**
```json
{
  "nome_loja": "Minha Loja",
  "logo": "/uploads/logo.png",
  "contato_email": "contato@exemplo.com",
  "whatsapp": "11999999999",
  "redes_sociais": {
    "facebook": "https://facebook.com/minhaloja",
    "instagram": "https://instagram.com/minhaloja"
  }
}
```

### Obter Todas as Configurações (Admin)

```
GET /api/configuracoes
```

### Atualizar Configurações (Admin)

```
PUT /api/configuracoes
```

**Payload:**
```json
{
  "nome_loja": "Nova Loja",
  "logo": "base64...",
  "contato_email": "novo@exemplo.com",
  "whatsapp": "11999999999",
  "configuracoes_pagamento": {
    "mercado_pago_key": "chave_secreta"
  }
}
```

### Obter Configuração Específica (Admin)

```
GET /api/configuracoes/:chave
```

### Definir Configuração Específica (Admin)

```
PUT /api/configuracoes/:chave
```

**Payload:**
```json
{
  "valor": "novo valor"
}
```

### Inicializar Configurações Padrão (Admin)

```
POST /api/configuracoes/inicializar
```

**Resposta:**
```json
{
  "mensagem": "Configurações padrão inicializadas com sucesso"
}
```

## CEP

### Buscar CEP

```
GET /api/cep/:cep
```

**Resposta:**
```json
{
  "cep": "01001-000",
  "logradouro": "Praça da Sé",
  "complemento": "lado ímpar",
  "bairro": "Sé",
  "cidade": "São Paulo",
  "estado": "SP"
}
```

### Validar CEP

```
GET /api/cep/:cep/validar
```

**Resposta:**
```json
{
  "valido": true,
  "cep": "01001-000"
}
```
