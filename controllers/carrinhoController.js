const carrinhoService = require("../services/carrinhoService")

// Função helper para obter o identificador da sessão/usuário
const getIdentificador = (req) => {
  // Se o usuário está logado, o ID dele é o identificador principal.
  if (req.user && req.user.id) {
    return `user_${req.user.id}`;
  }
  // Para convidados, usamos o sessionId enviado pelo frontend.
  if (req.body.sessionId || req.query.sessionId) {
    return req.body.sessionId || req.query.sessionId;
  }
  return null;
}

const carrinhoController = {
  async adicionarAoCarrinho(req, res, next) {
    try {
      const identificador = getIdentificador(req);
      const { produtoId, quantidade, variacaoId } = req.body;
      const usuarioId = req.user ? req.user.id : null;

      if (!identificador) {
        return res.status(400).json({ erro: "Identificador de sessão não fornecido." });
      }
      if (!produtoId || !quantidade) {
        return res.status(400).json({ erro: "ID do produto e quantidade são obrigatórios." });
      }

      const carrinho = await carrinhoService.adicionarAoCarrinho(identificador, usuarioId, produtoId, quantidade, variacaoId);
      res.json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  async removerDoCarrinho(req, res, next) {
    try {
      const identificador = getIdentificador(req);
      const { produtoId, variacaoId } = req.body;
      const usuarioId = req.user ? req.user.id : null;

      if (!identificador) {
        return res.status(400).json({ erro: "Identificador de sessão não fornecido." });
      }
      if (!produtoId) {
        return res.status(400).json({ erro: "ID do produto é obrigatório." });
      }

      const carrinho = await carrinhoService.removerDoCarrinho(identificador, produtoId, variacaoId);
      res.json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  async obterCarrinho(req, res, next) {
    try {
      const identificador = getIdentificador(req);

      if (!identificador) {
        return res.json({ identificadorSessao: null, itens: [], total: 0 });
      }

      const carrinho = await carrinhoService.obterCarrinho(identificador);
      res.json(carrinho);
    } catch (error) {
      next(error);
    }
  },
  
  async atualizarCarrinho(req, res, next) {
    try {
      const identificador = getIdentificador(req);
      const { itens } = req.body;
      const usuarioId = req.user ? req.user.id : null;

      if (!identificador) {
        return res.status(400).json({ erro: "Identificador de sessão não fornecido." });
      }
       if (!itens || !Array.isArray(itens)) {
        return res.status(400).json({ erro: "O campo 'itens' deve ser um array." });
      }

      const carrinho = await carrinhoService.atualizarCarrinho(identificador, usuarioId, itens);
      res.json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  async limparCarrinho(req, res, next) {
    try {
      const identificador = getIdentificador(req);
      if (!identificador) {
        return res.status(400).json({ erro: "Identificador de sessão não fornecido." });
      }

      const carrinho = await carrinhoService.limparCarrinho(identificador);
      res.json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  // ROTA NOVA E CRÍTICA PARA A MIGRAÇÃO
  async migrarCarrinho(req, res, next) {
    try {
      const usuarioId = req.user.id;
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ erro: "O ID da sessão do convidado é obrigatório para a migração." });
      }

      await carrinhoService.migrarCarrinho(sessionId, usuarioId);
      const carrinhoFinal = await carrinhoService.obterCarrinho(`user_${usuarioId}`);
      
      res.json(carrinhoFinal);
    } catch (error) {
      next(error)
    }
  }
};

module.exports = carrinhoController;