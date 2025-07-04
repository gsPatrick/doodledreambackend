const { Pedido, Usuario, Produto, Pagamento, ArquivoProduto, Frete, VariacaoProduto } = require("../models")
const { enviarEmail, templateConfirmacaoPedido } = require("../utils/email")
const cupomService = require("./cupomService")
const notificacaoService = require("./notificacaoService")
const pagamentoService = require("./pagamentoService")

const pedidoService = {
  async criarPedido(usuarioId, carrinho, endereco, freteId, cupomCodigo = null) {
    try {
      let total = 0
      let desconto = 0
      let valorFrete = 0
      let dadosFrete = null;

      // Verificar se todos os produtos são digitais
      const verificacoesDigitais = await Promise.all(carrinho.itens.map(async (item) => {
        if (item.variacaoId) {
          const variacao = await VariacaoProduto.findOne({ 
            where: { id: item.variacaoId, produtoId: item.produtoId }
          });
          return variacao?.digital || false;
        }
        return false;
      }));
      const todosDigitais = verificacoesDigitais.every(isDigital => isDigital);

      // Se não for pedido totalmente digital, validar endereço e frete
      if (!todosDigitais) {
        if (!endereco) {
          throw new Error("Endereço de entrega é obrigatório para produtos físicos");
        }
        if (!freteId) {
          throw new Error("Método de frete é obrigatório para produtos físicos");
        }
      }

      // Verificar se o frete existe (apenas para produtos físicos)
      if (freteId) {
        // Garante que freteId seja uma string para a verificação
        const freteIdStr = String(freteId);

        // Verifica se é um método personalizado
        if (freteIdStr.startsWith('custom_')) {
          const metodoFreteId = freteIdStr.replace('custom_', '');
          const { MetodoFrete } = require("../models");
          const metodoFrete = await MetodoFrete.findByPk(metodoFreteId);

          if (!metodoFrete) {
            throw new Error("Método de frete não encontrado");
          }

          valorFrete = parseFloat(metodoFrete.valor);
          dadosFrete = {
            servico: metodoFrete.titulo,
            valor: valorFrete,
            prazoEntrega: metodoFrete.prazoEntrega,
            statusEntrega: "pendente"
          };
        } else {
          // Implementar lógica para frete do Melhor Envio
          // Por simplificação, vamos assumir um valor fixo
          valorFrete = 15.00;
          dadosFrete = {
            servico: "Correios PAC",
            valor: valorFrete,
            prazoEntrega: 7,
            statusEntrega: "pendente"
          };
        }
      }

      // Calcular total dos itens
      const itensProcessados = [];
      for (const item of carrinho.itens) {
        const produto = await Produto.findByPk(item.produtoId)
        if (!produto || !produto.ativo) {
          throw new Error(`Produto ${item.produtoId} não encontrado ou inativo`)
        }

        let variacao = null;
        let precoBase = produto.preco;
        let eDigital = false;
        if (item.variacaoId) {
          variacao = await VariacaoProduto.findOne({ where: { id: item.variacaoId, produtoId: item.produtoId } })
          if (!variacao || !variacao.ativo) {
            throw new Error(`Variação ${item.variacaoId} não encontrada`)
          }
          precoBase = variacao.preco;
          eDigital = variacao.digital;
          // Checar estoque se não for digital
          if (!eDigital && variacao.estoque < item.quantidade) {
            throw new Error(`Estoque insuficiente para a variação ${variacao.nome}`)
          }
        } else {
          if (produto.estoque < item.quantidade) {
            throw new Error(`Estoque insuficiente para ${produto.nome}`)
          }
        }

        total += precoBase * item.quantidade;

        // Adicionar informações completas do produto/variação ao item
        itensProcessados.push({
          produtoId: item.produtoId,
          variacaoId: item.variacaoId || null,
          nome: variacao ? `${produto.nome} - ${variacao.nome}` : produto.nome,
          preco: precoBase,
          quantidade: item.quantidade,
          subtotal: precoBase * item.quantidade,
          digital: eDigital,
        });
      }

      // Aplicar cupom se fornecido
      if (cupomCodigo) {
        const resultadoCupom = await cupomService.aplicarCupom({ total }, cupomCodigo)
        desconto = resultadoCupom.desconto;
        total = resultadoCupom.total;
      }

      // Adicionar valor do frete ao total
      const totalComFrete = total + valorFrete;

      // Criar o pedido
      const pedido = await Pedido.create({
        usuarioId,
        itens: itensProcessados,
        total: todosDigitais ? total : totalComFrete,
        valorFrete: todosDigitais ? 0 : valorFrete,
        desconto,
        cupomAplicado: cupomCodigo,
        enderecoEntrega: todosDigitais ? null : endereco,
        status: "pendente",
      });

      // Criar o registro de frete apenas para produtos físicos
      if (dadosFrete && !todosDigitais) {
        await Frete.create({
          pedidoId: pedido.id,
          ...dadosFrete
        });
      }

      // Gerar automaticamente o link de pagamento
      const checkoutInfo = await pagamentoService.criarCheckoutPro(pedido.id, usuarioId);

      // Atualizar estoque para produtos físicos ou variações físicas
      for (const item of carrinho.itens) {
        if (item.variacaoId) {
          const variacao = await VariacaoProduto.findByPk(item.variacaoId)
          if (variacao && !variacao.digital) {
            variacao.estoque -= item.quantidade
            await variacao.save()
          }
        } else {
          const produto = await Produto.findByPk(item.produtoId)
          if (produto) {
            produto.estoque -= item.quantidade
            await produto.save()
          }
        }
      }

      // Retorna diretamente o objeto do pedido criado.
      // O frontend irá então chamar a rota de pagamento com o ID do pedido.
      return pedido;
    } catch (error) {
      throw error
    }
  },

  async atualizarStatusPedido(pedidoId, status) {
    try {
      const pedido = await Pedido.findByPk(pedidoId, {
        include: [{ model: Usuario }],
      })

      if (!pedido) {
        throw new Error("Pedido não encontrado")
      }

      pedido.status = status
      await pedido.save()

      // Enviar notificação automática
      try {
        await notificacaoService.enviarAtualizacaoStatus(pedidoId, status)
      } catch (emailError) {
        console.error("Erro ao enviar notificação:", emailError)
        // Não falhar a operação se o email falhar
      }

      // Enviar email de confirmação se status for "pago"
      if (status === "pago") {
        await enviarEmail(pedido.Usuario.email, "Pedido Confirmado", templateConfirmacaoPedido(pedido))
      }

      return pedido
    } catch (error) {
      throw error
    }
  },

  async listarPedidos(usuarioId, filtros = {}) {
    try {
      const { status, page = 1, limit = 10 } = filtros
      const where = {}
      if (usuarioId != null) where.usuarioId = usuarioId

      if (status) {
        where.status = status
      }

      const offset = (page - 1) * limit

      const { count, rows } = await Pedido.findAndCountAll({
        where,
        include: [{ model: Usuario, attributes: ["nome", "email"] }],
        limit: Number.parseInt(limit),
        offset,
        order: [["createdAt", "DESC"]],
      })

      // Mapear pedidos para incluir detalhes dos produtos nos itens
      const pedidosComDetalhes = await Promise.all(rows.map(async (pedido) => {
        const itensComDetalhes = await Promise.all(pedido.itens.map(async (item) => {
          const produto = await Produto.findByPk(item.produtoId, {
            include: [{ model: ArquivoProduto, as: 'ArquivoProdutos' }]
          });
          
          let imagemUrl = null;
          if (produto && produto.ArquivoProdutos && produto.ArquivoProdutos.length > 0) {
            // A URL já vem completa do banco de dados, não é necessário adicionar prefixos.
            imagemUrl = produto.ArquivoProdutos[0].url;
          }

          return {
            ...item,
            produto: {
              id: produto ? produto.id : null,
              nome: produto ? produto.nome : 'Produto não encontrado',
              imagemUrl: imagemUrl
            }
          };
        }));
        
        // Retorna uma nova versão do objeto do pedido com os itens detalhados
        return { ...pedido.toJSON(), itens: itensComDetalhes };
      }));

      return {
        pedidos: pedidosComDetalhes,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Number.parseInt(page),
      }
    } catch (error) {
      throw error
    }
  },

  async buscarPedidoPorId(pedidoId) {
    try {
      const pedido = await Pedido.findByPk(pedidoId, {
        include: [{ model: Usuario, attributes: ["nome", "email"] }, { model: Pagamento }],
      })

      if (!pedido) {
        throw new Error("Pedido não encontrado")
      }

      return pedido
    } catch (error) {
      throw error
    }
  },

  async cancelarPedido(pedidoId) {
    try {
      const pedido = await Pedido.findByPk(pedidoId)
      if (!pedido) {
        throw new Error("Pedido não encontrado")
      }

      if (pedido.status === "entregue") {
        throw new Error("Não é possível cancelar pedido já entregue")
      }

      // Restaurar estoque
      for (const item of pedido.itens) {
        if (item.variacaoId) {
          const variacao = await VariacaoProduto.findByPk(item.variacaoId)
          if (variacao && !variacao.digital) {
            variacao.estoque += item.quantidade
            await variacao.save()
          }
        } else {
          const produto = await Produto.findByPk(item.produtoId)
          if (produto) {
            produto.estoque += item.quantidade
            await produto.save()
          }
        }
      }

      pedido.status = "cancelado"
      await pedido.save()

      return pedido
    } catch (error) {
      throw error
    }
  },

  async verificarSeUsuarioComprouProduto(usuarioId, produtoId) {
    try {
      const pedido = await Pedido.findOne({
        where: {
          usuarioId,
          status: "pago",
        },
      })

      if (!pedido) return false

      const comprouProduto = pedido.itens.some((item) => item.produtoId === produtoId)
      return comprouProduto
    } catch (error) {
      throw error
    }
  },

  async listarProdutosPagosPorUsuario(usuarioId) {
    try {
      const pedidos = await Pedido.findAll({
        where: {
          usuarioId,
          status: "pago",
        },
      })

      const produtosPagos = []
      for (const pedido of pedidos) {
        for (const item of pedido.itens) {
          const produto = await Produto.findByPk(item.produtoId, {
            include: [{ model: ArquivoProduto }],
          })
          if (produto) {
            produtosPagos.push({
              produtoId: produto.id,
              nome: produto.nome,
              arquivos: produto.ArquivoProdutos,
            })
          }
        }
      }

      return produtosPagos
    } catch (error) {
      throw error
    }
  },

  async obterDownloadsPorUsuario(usuarioId) {
    try {
      const pedidos = await Pedido.findAll({
        where: {
          usuarioId,
          status: ['pago', 'processando', 'concluido'], // Status que garantem o pagamento
        },
        include: [
          {
            model: Produto,
            as: 'produtos',
            through: { attributes: [] },
          },
        ],
      });

      // Extrai e achata a lista de produtos digitais de todos os pedidos
      const downloads = pedidos.flatMap(pedido => pedido.produtos);
      
      // Remove duplicatas caso o mesmo produto tenha sido comprado mais de uma vez
      const uniqueDownloads = Array.from(new Map(downloads.map(item => [item.id, item])).values());

      return uniqueDownloads;
    } catch (error) {
      console.error("Erro ao obter downloads do usuário:", error);
      throw new Error("Erro ao buscar seus produtos digitais.");
    }
  },
}

module.exports = pedidoService
