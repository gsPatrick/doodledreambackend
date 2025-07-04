const { Carrinho, Produto, VariacaoProduto } = require("../models")

const carrinhoService = {
  async adicionarAoCarrinho(usuarioId, produtoId, quantidade = 1, variacaoId = null) {
    try {
      const produto = await Produto.findByPk(produtoId)
      if (!produto || !produto.ativo) {
        throw new Error("Produto não encontrado ou inativo")
      }

      // Se existir variação, validar
      let variacao = null
      let precoReferencia;
      if (variacaoId) {
        variacao = await VariacaoProduto.findOne({ where: { id: variacaoId, produtoId } })
        if (!variacao || !variacao.ativo) {
          throw new Error("Variação não encontrada ou inativa")
        }
        if (!variacao.digital && variacao.estoque < quantidade) {
          throw new Error("Estoque insuficiente para esta variação")
        }
        precoReferencia = variacao.preco
      } else {
        throw new Error("Produto sem variação não é permitido")
      }

      let carrinho = await Carrinho.findOne({ where: { usuarioId } })

      if (!carrinho) {
        carrinho = await Carrinho.create({
          usuarioId,
          itens: [],
          total: 0,
        })
      }

      const itens = carrinho.itens || []
      const itemExistente = itens.find((item) => item.produtoId === produtoId && item.variacaoId === variacaoId)

      if (itemExistente) {
        itemExistente.quantidade += quantidade
      } else {
        itens.push({
          produtoId,
          variacaoId,
          nome: variacao ? `${produto.nome} - ${variacao.nome}` : produto.nome,
          preco: precoReferencia,
          quantidade,
        })
      }

      const total = itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0)

      // Atualiza diretamente no banco para garantir persistência
      await Carrinho.update({ itens, total }, { where: { id: carrinho.id } })
      // Recupera carrinho atualizado
      const carrinhoAtualizado = await Carrinho.findOne({ where: { id: carrinho.id } })
      return carrinhoAtualizado
    } catch (error) {
      throw error
    }
  },

  async removerDoCarrinho(usuarioId, produtoId, variacaoId = null) {
    try {
      const carrinho = await Carrinho.findOne({ where: { usuarioId } })
      if (!carrinho) {
        throw new Error("Carrinho não encontrado")
      }

      const itens = carrinho.itens.filter((item) => !(item.produtoId === produtoId && item.variacaoId === variacaoId))
      const total = itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0)

      await Carrinho.update({ itens, total }, { where: { id: carrinho.id } })
      const carrinhoAtualizado = await Carrinho.findOne({ where: { id: carrinho.id } })
      return carrinhoAtualizado
    } catch (error) {
      throw error
    }
  },

  async atualizarCarrinho(usuarioId, itens) {
    try {
      const carrinho = await Carrinho.findOne({ where: { usuarioId } })
      if (!carrinho) {
        throw new Error("Carrinho não encontrado")
      }

      for (const item of itens) {
        const produto = await Produto.findByPk(item.produtoId)
        if (!produto || !produto.ativo) {
          throw new Error(`Produto ${item.produtoId} não encontrado`)
        }

        let variacao = null
        let precoRef;
        if (item.variacaoId) {
          variacao = await VariacaoProduto.findOne({ where: { id: item.variacaoId, produtoId: item.produtoId } })
          if (!variacao || !variacao.ativo) {
            throw new Error(`Variação ${item.variacaoId} não encontrada`)
          }
          if (!variacao.digital && variacao.estoque < item.quantidade) {
            throw new Error(`Estoque insuficiente para a variação ${variacao.nome}`)
          }
          precoRef = variacao.preco
        } else {
          throw new Error("Produto sem variação não é permitido")
        }

        item.nome = variacao ? `${produto.nome} - ${variacao.nome}` : produto.nome
        item.preco = precoRef
      }

      const total = itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0)

      // Atualiza diretamente no banco para garantir persistência
      await Carrinho.update({ itens, total }, { where: { id: carrinho.id } })
      // Recupera carrinho atualizado
      const carrinhoAtualizado = await Carrinho.findOne({ where: { id: carrinho.id } })
      return carrinhoAtualizado
    } catch (error) {
      throw error
    }
  },

  async obterCarrinho(usuarioId) {
    try {
      let carrinho = await Carrinho.findOne({ where: { usuarioId } })

      if (!carrinho) {
        carrinho = await Carrinho.create({
          usuarioId,
          itens: [],
          total: 0,
        })
      }

      // Converte a instancia em objeto plano para podermos sobrescrever as propriedades
      const carrinhoPlain = carrinho.toJSON()

      // Para cada item armazenado no carrinho, buscamos o produto completo com suas variações
      const itensDetalhados = await Promise.all(
        (carrinhoPlain.itens || []).map(async (item) => {
          const produto = await Produto.findByPk(item.produtoId, {
            include: [{
              model: VariacaoProduto,
              as: 'variacoes',
              where: { ativo: true },
              required: false
            }]
          });
          return {
            ...item,
            produto: produto ? produto.toJSON() : null,
          }
        }),
      )

      carrinhoPlain.itens = itensDetalhados
      return carrinhoPlain
    } catch (error) {
      throw error
    }
  },

  async limparCarrinho(usuarioId) {
    try {
      const carrinho = await Carrinho.findOne({ where: { usuarioId } })
      if (!carrinho) {
        throw new Error("Carrinho não encontrado")
      }

      carrinho.itens = []
      carrinho.total = 0
      await carrinho.save()

      return carrinho
    } catch (error) {
      throw error
    }
  },
}

module.exports = carrinhoService
