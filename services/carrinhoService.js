const { Carrinho, Produto, VariacaoProduto } = require("../models");

const carrinhoService = {
  /**
   * Adiciona um item ao carrinho do usuário.
   */
  async adicionarAoCarrinho(usuarioId, produtoId, quantidade = 1, variacaoId = null) {
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
        precoReferencia = parseFloat(variacao.preco); // Garante que o preço é um número
      } else {
        throw new Error("A seleção de uma variação do produto é obrigatória.");
      }

      // Busca ou cria o carrinho para o usuário
      const [carrinho] = await Carrinho.findOrCreate({
        where: { usuarioId },
        defaults: {
          usuarioId,
          itens: [],
          total: 0,
        },
      });

      // Garante que 'itens' seja um array JavaScript
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

      // Atualiza o carrinho. Sequelize lida com a conversão do array para string JSON.
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
   * Remove um item do carrinho do usuário.
   */
  async removerDoCarrinho(usuarioId, produtoId, variacaoId = null) {
    try {
      const carrinho = await Carrinho.findOne({ where: { usuarioId } });
      if (!carrinho) {
        return { itens: [], total: 0 }; // Se não há carrinho, não há o que remover.
      }

      const itens = Array.isArray(carrinho.itens) ? carrinho.itens : JSON.parse(carrinho.itens || '[]');
      
      const novosItens = itens.filter((item) => !(item.produtoId == produtoId && item.variacaoId == variacaoId));

      // Se nada mudou, não precisa atualizar o banco
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
   * Atualiza a lista de itens do carrinho.
   */
  async atualizarCarrinho(usuarioId, itensRecebidos) {
    try {
      const [carrinho] = await Carrinho.findOrCreate({
        where: { usuarioId },
        defaults: { usuarioId, itens: [], total: 0 },
      });

      // Valida cada item recebido para garantir que os dados estão corretos
      const itensValidados = [];
      for (const item of itensRecebidos) {
        const produto = await Produto.findByPk(item.produtoId);
        if (!produto || !produto.ativo) continue; // Pula itens inválidos

        const variacao = await VariacaoProduto.findOne({ where: { id: item.variacaoId, produtoId: item.produtoId } });
        if (!variacao || !variacao.ativo) continue; // Pula variações inválidas

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
   * Obtém o carrinho do usuário com detalhes dos produtos.
   */
  async obterCarrinho(usuarioId) {
    try {
      const [carrinho] = await Carrinho.findOrCreate({
        where: { usuarioId },
        defaults: { usuarioId, itens: [], total: 0 },
      });
      
      // Converte a instância do Sequelize para um objeto plano
      const carrinhoPlain = carrinho.toJSON();
      
      const itensDoCarrinho = Array.isArray(carrinhoPlain.itens) ? carrinhoPlain.itens : JSON.parse(carrinhoPlain.itens || '[]');

      // Para cada item, busca os detalhes do produto e da variação
      const itensDetalhados = await Promise.all(
        itensDoCarrinho.map(async (item) => {
          const produto = await Produto.findByPk(item.produtoId, {
            include: [{
              model: VariacaoProduto,
              as: 'variacoes',
              where: { ativo: true },
              required: false
            },
            {
              model: require('./ArquivoProduto'), // Importação local para evitar dependência circular
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
      
      // Filtra itens cujo produto não foi encontrado (pode ter sido desativado)
      carrinhoPlain.itens = itensDetalhados.filter(item => item.produto);
      
      return carrinhoPlain;
    } catch (error) {
      console.error("ERRO NO SERVIÇO (obterCarrinho):", error);
      throw error;
    }
  },

  /**
   * Limpa todos os itens do carrinho do usuário.
   */
  async limparCarrinho(usuarioId) {
    try {
      const carrinho = await Carrinho.findOne({ where: { usuarioId } });
      if (carrinho) {
        carrinho.itens = [];
        carrinho.total = 0;
        await carrinho.save();
        return carrinho;
      }
      return { itens: [], total: 0 };
    } catch (error) {
      console.error("ERRO NO SERVIÇO (limparCarrinho):", error);
      throw error;
    }
  },
};

module.exports = carrinhoService;