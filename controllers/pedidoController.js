const pedidoService = require("../services/pedidoService")
const carrinhoService = require("../services/carrinhoService")
const cupomService = require("../services/cupomService")
const freteService = require("../services/freteService")
const configuracaoLojaService = require("../services/configuracaoLojaService")
require("dotenv").config()

const pedidoController = {
  async criarPedido(req, res, next) {
    try {
      const usuarioId = req.usuario.id
      const { cupomCodigo, enderecoEntregaId, freteId } = req.body

      // Obter carrinho do usuário
      const carrinho = await carrinhoService.obterCarrinho(usuarioId)

      if (!carrinho.itens || carrinho.itens.length === 0) {
        return res.status(400).json({ erro: "Carrinho vazio" })
      }

      // Verificar se todos os produtos são digitais
      const { VariacaoProduto } = require("../models");
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
        if (!enderecoEntregaId || !freteId) {
          return res.status(400).json({ erro: "Endereço de entrega e método de frete são obrigatórios para produtos físicos" });
        }
      }

      // Obter endereço de entrega apenas se não for pedido totalmente digital
      let endereco = null;
      if (!todosDigitais && enderecoEntregaId) {
        const { EnderecoUsuario } = require("../models");
        endereco = await EnderecoUsuario.findOne({
          where: { id: enderecoEntregaId, usuarioId }
        });

        if (!endereco) {
          return res.status(400).json({ erro: "Endereço de entrega não encontrado" });
        }
      }

      // Validar cupom se fornecido
      if (cupomCodigo) {
        try {
          await cupomService.validarCupom(cupomCodigo);
        } catch (error) {
          return res.status(400).json({ erro: error.message });
        }
      }

      // Criar pedido com todas as informações
      const resultado = await pedidoService.criarPedido(
        usuarioId,
        carrinho,
        endereco ? endereco.toJSON() : null,
        todosDigitais ? null : freteId,
        cupomCodigo
      );

      // Limpar carrinho após criar pedido
      await carrinhoService.limparCarrinho(usuarioId)

      res.status(201).json(resultado)
    } catch (error) {
      console.log(error)
      next(error)
    }
  },

  async atualizarStatus(req, res, next) {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!status) {
        return res.status(400).json({ erro: "Status é obrigatório" })
      }

      const pedido = await pedidoService.atualizarStatusPedido(id, status)
      res.json(pedido)
    } catch (error) {
      next(error)
    }
  },

  async cancelarPedido(req, res, next) {
    try {
      const { id } = req.params
      const usuarioId = req.usuario.id

      // Verificar se o pedido pertence ao usuário (exceto admin)
      if (req.usuario.tipo !== "admin") {
        const pedidoExistente = await pedidoService.buscarPedidoPorId(id)
        if (pedidoExistente.usuarioId !== usuarioId) {
          return res.status(403).json({ erro: "Acesso negado" })
        }
      }

      const pedido = await pedidoService.cancelarPedido(id)
      res.json(pedido)
    } catch (error) {
      next(error)
    }
  },

  async listarPedidosAdmin(req, res, next) {
    try {
      const pedidos = await pedidoService.listarPedidos(null, req.query);
      res.json(pedidos);
    } catch (error) {
      next(error);
    }
  },

  async listarPedidosCliente(req, res, next) {
    try {
      const usuarioId = req.usuario.id;
      const pedidos = await pedidoService.listarPedidos(usuarioId, req.query);
      res.json(pedidos);
    } catch (error) {
      next(error);
    }
  },

  async buscarPedido(req, res, next) {
    try {
      const { id } = req.params
      const pedido = await pedidoService.buscarPedidoPorId(id)

      // Verificar se o pedido pertence ao usuário (exceto admin)
      if (req.usuario.tipo !== "admin" && pedido.usuarioId !== req.usuario.id) {
        return res.status(403).json({ erro: "Acesso negado" })
      }

      res.json(pedido)
    } catch (error) {
      next(error)
    }
  },

  async adicionarNotaInterna(req, res, next) {
    try {
      const { id } = req.params
      const { nota } = req.body
      const pedido = await pedidoService.buscarPedidoPorId(id)
      pedido.obsInterna = nota
      await pedido.save()
      res.json(pedido)
    } catch (error) {
      next(error)
    }
  },

  async gerarEtiqueta(req, res, next) {
    try {
      const { id } = req.params
      const pedido = await pedidoService.buscarPedidoPorId(id)
      const enderecoDestino = pedido.enderecoEntrega
      const enderecoOrigem = await configuracaoLojaService.obterEnderecoOrigem()

      // Validação para garantir que o endereço de origem está configurado
      if (!enderecoOrigem || !enderecoOrigem.cep) {
        throw new Error("Endereço de origem não configurado no sistema. Por favor, configure os dados da loja no painel de administração.");
      }

      const etiqueta = await freteService.gerarEtiqueta(id, enderecoOrigem, enderecoDestino, pedido.itens)
      res.json(etiqueta)
    } catch (error) {
      next(error)
    }
  },

  async comprarEtiqueta(req, res, next) {
    try {
      const { etiquetaId } = req.body
      if (!etiquetaId) {
        return res.status(400).json({ erro: "O ID da etiqueta é obrigatório." })
      }
      
      const resultado = await freteService.comprarEtiqueta([etiquetaId])
      
      // Aqui, você pode querer salvar o código de rastreio no seu pedido
      // Ex: await pedidoService.salvarRastreio(pedidoId, resultado.tracking);
      
      res.json(resultado)
    } catch (error) {
      next(error)
    }
  },

  async imprimirEtiqueta(req, res, next) {
    try {
      const { etiquetaId } = req.body
      if (!etiquetaId) {
        return res.status(400).json({ erro: "O ID da etiqueta é obrigatório." })
      }
      
      const pdf = await freteService.imprimirEtiqueta([etiquetaId])
      
      res.set(pdf.headers);
      res.send(pdf.data);

    } catch (error) {
      next(error)
    }
  },

  async obterDownloadsUsuario(req, res, next) {
    try {
      const usuarioId = req.usuario.id;
      const downloads = await pedidoService.obterDownloadsPorUsuario(usuarioId);
      res.status(200).json(downloads);
    } catch (error) {
      next(error);
    }
  },
}

module.exports = pedidoController
