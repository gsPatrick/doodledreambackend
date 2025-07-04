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

  async atualizarCarrinho(usuarioId, itensRecebidos) {
    try {
      const [carrinho] = await Carrinho.findOrCreate({
        where: { usuarioId },
        defaults: { usuarioId, itens: [], total: 0 },
      });

      const itensAtuais = Array.isArray(carrinho.itens) ? carrinho.itens : JSON.parse(carrinho.itens || '[]');
      
      // Mescla os itens recebidos com os itens atuais
      itensRecebidos.forEach(async (itemRecebido) => {
        const itemExistenteIndex = itensAtuais.findIndex(i => i.produtoId == itemRecebido.produtoId && i.variacaoId == itemRecebido.variacaoId);

        if (itemExistenteIndex > -1) {
          // Se o item já existe, soma a quantidade
          itensAtuais[itemExistenteIndex].quantidade += itemRecebido.quantidade;
        } else {
          // Se não existe, busca detalhes e adiciona
          const produto = await Produto.findByPk(itemRecebido.produtoId);
          const variacao = await VariacaoProduto.findByPk(itemRecebido.variacaoId);
          if (produto && variacao) {
            itensAtuais.push({
              produtoId: itemRecebido.produtoId,
              variacaoId: itemRecebido.variacaoId,
              quantidade: itemRecebido.quantidade,
              preco: parseFloat(variacao.preco),
              nome: `${produto.nome} - ${variacao.nome}`
            });
          }
        }
      });
      
      const total = itensAtuais.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

      carrinho.itens = itensAtuais;
      carrinho.total = total;
      await carrinho.save();

      return carrinho;
    } catch (error) {
      console.error("ERRO NO SERVIÇO (atualizarCarrinho):", error);
      throw error;
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
