const { Carrinho, Produto, VariacaoProduto } = require("../models");

const carrinhoService = {
  /**
   * Adiciona um item ao carrinho.
   * A busca pelo carrinho é feita usando o identificadorSessao.
   * Se o usuário estiver logado, o usuarioId é vinculado ao carrinho.
   *
   * @param {string} identificadorSessao - O ID da sessão do visitante ou o ID do usuário logado.
   * @param {number|null} usuarioId - O ID do usuário, se estiver logado.
   * @param {number} produtoId - O ID do produto a ser adicionado.
   * @param {number} quantidade - A quantidade do produto.
   * @param {number|null} variacaoId - O ID da variação do produto.
   */
  async adicionarAoCarrinho(identificadorSessao, usuarioId, produtoId, quantidade = 1, variacaoId = null) {
    try {
      const produto = await Produto.findByPk(produtoId);
      if (!produto || !produto.ativo) {
        throw new Error("Produto não encontrado ou inativo");
      }

      let variacao = null;
      let precoReferencia;
      if (variacaoId) {
        variacao = await VariacaoProduto.findOne({ where: { id: variacaoId, produtoId } });
        if (!variacao || !variacao.ativo) {
          throw new Error("Variação não encontrada ou inativa");
        }
        if (!variacao.digital && variacao.estoque < quantidade) {
          throw new Error("Estoque insuficiente para esta variação");
        }
        precoReferencia = parseFloat(variacao.preco);
      } else {
        throw new Error("A seleção de uma variação do produto é obrigatória.");
      }

      // Busca ou cria o carrinho para a sessão/usuário usando o identificadorSessao
      const [carrinho] = await Carrinho.findOrCreate({
        where: { identificadorSessao },
        defaults: {
          identificadorSessao,
          usuarioId: usuarioId, // Vincula ao usuário se ele estiver logado na criação
          itens: [],
          total: 0,
        },
      });

      // Se um visitante com carrinho fizer login, atualizamos o usuarioId no carrinho existente.
      if (usuarioId && !carrinho.usuarioId) {
        carrinho.usuarioId = usuarioId;
      }

      const itens = Array.isArray(carrinho.itens) ? carrinho.itens : JSON.parse(carrinho.itens || '[]');
      const itemExistenteIndex = itens.findIndex((item) => item.produtoId == produtoId && item.variacaoId == variacaoId);

      if (itemExistenteIndex > -1) {
        itens[itemExistenteIndex].quantidade += quantidade;
      } else {
        itens.push({
          produtoId: parseInt(produtoId),
          variacaoId: parseInt(variacaoId),
          nome: `${produto.nome} - ${variacao.nome}`,
          preco: precoReferencia,
          quantidade,
        });
      }

      const total = itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

      carrinho.itens = itens;
      carrinho.total = total;
      await carrinho.save();

      return carrinho;

    } catch (error) {
      console.error("ERRO NO SERVIÇO (adicionarAoCarrinho):", error);
      throw error;
    }
  },

  /**
   * Remove um item do carrinho.
   * @param {string} identificadorSessao - O ID da sessão ou do usuário.
   * @param {number} produtoId - O ID do produto.
   * @param {number|null} variacaoId - O ID da variação.
   */
  async removerDoCarrinho(identificadorSessao, produtoId, variacaoId = null) {
    try {
      const carrinho = await Carrinho.findOne({ where: { identificadorSessao } });
      if (!carrinho) {
        return { itens: [], total: 0 };
      }

      const itens = Array.isArray(carrinho.itens) ? carrinho.itens : JSON.parse(carrinho.itens || '[]');
      const novosItens = itens.filter((item) => !(item.produtoId == produtoId && item.variacaoId == variacaoId));

      if (novosItens.length === itens.length) {
        return carrinho;
      }

      const total = novosItens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

      carrinho.itens = novosItens;
      carrinho.total = total;
      await carrinho.save();

      return carrinho;
    } catch (error) {
      console.error("ERRO NO SERVIÇO (removerDoCarrinho):", error);
      throw error;
    }
  },

  /**
   * Atualiza a lista completa de itens do carrinho.
   * @param {string} identificadorSessao - O ID da sessão ou do usuário.
   * @param {number|null} usuarioId - O ID do usuário, se logado.
   * @param {Array} itensRecebidos - O novo array de itens.
   */
  async atualizarCarrinho(identificadorSessao, usuarioId, itensRecebidos) {
    try {
      const [carrinho] = await Carrinho.findOrCreate({
        where: { identificadorSessao },
        defaults: { identificadorSessao, usuarioId, itens: [], total: 0 },
      });

      const itensValidados = [];
      for (const item of itensRecebidos) {
        const produto = await Produto.findByPk(item.produtoId);
        if (!produto || !produto.ativo) continue;

        const variacao = await VariacaoProduto.findOne({ where: { id: item.variacaoId, produtoId: item.produtoId } });
        if (!variacao || !variacao.ativo) continue;

        itensValidados.push({
          produtoId: parseInt(item.produtoId),
          variacaoId: parseInt(item.variacaoId),
          nome: `${produto.nome} - ${variacao.nome}`,
          preco: parseFloat(variacao.preco),
          quantidade: parseInt(item.quantidade) || 1,
        });
      }

      const total = itensValidados.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

      carrinho.itens = itensValidados;
      carrinho.total = total;
      await carrinho.save();

      return carrinho;
    } catch (error) {
      console.error("ERRO NO SERVIÇO (atualizarCarrinho):", error);
      throw error;
    }
  },

  /**
   * Obtém o carrinho com detalhes dos produtos.
   * @param {string} identificadorSessao - O ID da sessão ou do usuário.
   */
  async obterCarrinho(identificadorSessao) {
    try {
      const [carrinho] = await Carrinho.findOrCreate({
        where: { identificadorSessao },
        defaults: { identificadorSessao, itens: [], total: 0 },
      });

      const carrinhoPlain = carrinho.toJSON();
      const itensDoCarrinho = Array.isArray(carrinhoPlain.itens) ? carrinhoPlain.itens : JSON.parse(carrinhoPlain.itens || '[]');

      const itensDetalhados = await Promise.all(
        itensDoCarrinho.map(async (item) => {
          const produto = await Produto.findByPk(item.produtoId, {
            include: [{
              model: VariacaoProduto,
              as: 'variacoes',
              where: { id: item.variacaoId }, // Pega a variação específica
              required: false
            },
            {
              // Evita dependência circular com uma importação local temporária.
              // O ideal é que os modelos sejam exportados de um 'index.js' central.
              model: require("../models/ArquivoProduto"),
              as: 'ArquivoProdutos',
              where: { tipo: 'imagem', principal: true },
              required: false
            }]
          });

          return {
            ...item,
            produto: produto ? produto.toJSON() : null,
          };
        })
      );
      
      carrinhoPlain.itens = itensDetalhados.filter(item => item.produto);
      
      return carrinhoPlain;
    } catch (error) {
      console.error("ERRO NO SERVIÇO (obterCarrinho):", error);
      throw error;
    }
  },

  /**
   * Limpa todos os itens do carrinho.
   * @param {string} identificadorSessao - O ID da sessão ou do usuário.
   */
  async limparCarrinho(identificadorSessao) {
    try {
      const carrinho = await Carrinho.findOne({ where: { identificadorSessao } });
      if (carrinho) {
        carrinho.itens = [];
        carrinho.total = 0;
        await carrinho.save();
        return carrinho;
      }
      // Se não houver carrinho, retorna um objeto vazio para consistência.
      return { identificadorSessao, itens: [], total: 0 };
    } catch (error) {
      console.error("ERRO NO SERVIÇO (limparCarrinho):", error);
      throw error;
    }
  },
};

module.exports = carrinhoService;