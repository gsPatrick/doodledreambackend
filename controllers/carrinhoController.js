// controllers/carrinhoController.js

const carrinhoService = require("../services/carrinhoService")

// Função helper para obter o identificador
const getIdentificador = (req) => {
  if (req.user && req.user.id) {
    return req.user.id.toString() // ID do usuário logado
  }
  if (req.body.sessionId) {
    return req.body.sessionId // ID da sessão do visitante
  }
  if (req.query.sessionId) {
    return req.query.sessionId
  }
  return null
}

const carrinhoController = {
  async adicionarAoCarrinho(req, res, next) {
    try {
      const identificadorSessao = getIdentificador(req)
      const { produtoId, quantidade, variacaoId } = req.body

      if (!identificadorSessao) {
        return res.status(400).json({ erro: "Identificador de sessão é obrigatório para visitantes." })
      }
      if (!produtoId || !quantidade) {
        return res.status(400).json({ erro: "Produto ID e quantidade são obrigatórios" })
      }

      const usuarioId = req.user ? req.user.id : null
      const carrinho = await carrinhoService.adicionarAoCarrinho(identificadorSessao, usuarioId, produtoId, quantidade, variacaoId)
      res.json(carrinho)
    } catch (error) {
      next(error)
    }
  },

  async removerDoCarrinho(req, res, next) {
    try {
      const identificadorSessao = getIdentificador(req)
      const { produtoId, variacaoId } = req.body

      if (!identificadorSessao) {
        return res.status(400).json({ erro: "Identificador de sessão é obrigatório para visitantes." })
      }
      if (!produtoId) {
        return res.status(400).json({ erro: "Produto ID é obrigatório" })
      }

      const carrinho = await carrinhoService.removerDoCarrinho(identificadorSessao, produtoId, variacaoId)
      res.json(carrinho)
    } catch (error) {
      next(error)
    }
  },

  async obterCarrinho(req, res, next) {
    try {
      // Para obter o carrinho, o sessionId pode vir como query param
      const identificadorSessao = getIdentificador(req)

      if (!identificadorSessao) {
        // Se não há usuário logado nem sessionId, retorna um carrinho vazio
        return res.json({ identificadorSessao: null, itens: [], total: 0 });
      }

      const carrinho = await carrinhoService.obterCarrinho(identificadorSessao)
      res.json(carrinho)
    } catch (error) {
      next(error)
    }
  },
  
  async atualizarCarrinho(req, res, next) {
    try {
      const identificadorSessao = getIdentificador(req);
      const { itens } = req.body;
      const usuarioId = req.user ? req.user.id : null;

      if (!identificadorSessao) {
        return res.status(400).json({ erro: "Identificador de sessão é obrigatório para visitantes." });
      }

      const carrinho = await carrinhoService.atualizarCarrinho(identificadorSessao, usuarioId, itens);
      res.json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  async limparCarrinho(req, res, next) {
    try {
      const identificadorSessao = getIdentificador(req)
      if (!identificadorSessao) {
        return res.status(400).json({ erro: "Identificador de sessão é obrigatório para visitantes." })
      }

      const carrinho = await carrinhoService.limparCarrinho(identificadorSessao)
      res.json(carrinho)
    } catch (error) {
      next(error)
    }
  },
}

module.exports = carrinhoController