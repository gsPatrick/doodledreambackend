const carrinhoService = require("../services/carrinhoService")

const carrinhoController = {
  async adicionarAoCarrinho(req, res, next) {
    try {
      const usuarioId = req.user.id
      const { produtoId, quantidade, variacaoId } = req.body

      if (!produtoId || !quantidade) {
        return res.status(400).json({ erro: "Produto ID e quantidade são obrigatórios" })
      }

      if (quantidade <= 0) {
        return res.status(400).json({ erro: "Quantidade deve ser maior que zero" })
      }

      const carrinho = await carrinhoService.adicionarAoCarrinho(usuarioId, produtoId, quantidade, variacaoId)
      res.json(carrinho)
    } catch (error) {
      next(error)
    }
  },

  async removerDoCarrinho(req, res, next) {
    try {
      const usuarioId = req.user.id
      const { produtoId, variacaoId } = req.body

      if (!produtoId) {
        return res.status(400).json({ erro: "Produto ID é obrigatório" })
      }

      const carrinho = await carrinhoService.removerDoCarrinho(usuarioId, produtoId, variacaoId)
      res.json(carrinho)
    } catch (error) {
      next(error)
    }
  },

  async obterCarrinho(req, res, next) {
    try {
      const usuarioId = req.user.id
      const carrinho = await carrinhoService.obterCarrinho(usuarioId)
      res.json(carrinho)
    } catch (error) {
      next(error)
    }
  },

  async atualizarCarrinho(req, res, next) {
    try {
      const usuarioId = req.user.id
      const { itens } = req.body

      if (!Array.isArray(itens)) {
        return res.status(400).json({ erro: "Itens deve ser um array" })
      }

      const carrinho = await carrinhoService.atualizarCarrinho(usuarioId, itens)
      res.json(carrinho)
    } catch (error) {
      next(error)
    }
  },

  async limparCarrinho(req, res, next) {
    try {
      const usuarioId = req.user.id
      const carrinho = await carrinhoService.limparCarrinho(usuarioId)
      res.json(carrinho)
    } catch (error) {
      next(error)
    }
  },
}

module.exports = carrinhoController
