const express = require("express")
const pedidoController = require("../controllers/pedidoController")
const { verifyToken, isAdmin } = require("../middleware/auth") // Usando o middleware padrão

const router = express.Router()

router.use(verifyToken) // Todas as rotas de pedido precisam de autenticação

// Rotas do cliente
router.get("/meus-pedidos", pedidoController.listarPedidosCliente)
router.get("/:id", pedidoController.buscarPedido)
router.post("/", pedidoController.criarPedido)
router.delete("/:id", pedidoController.cancelarPedido)
router.get("/meus/downloads", pedidoController.obterDownloadsUsuario)

// Rotas de Admin
router.get("/", isAdmin, pedidoController.listarPedidosAdmin)
router.put("/:id/status", isAdmin, pedidoController.atualizarStatus)
router.put("/:id/nota-interna", isAdmin, pedidoController.adicionarNotaInterna)
router.post("/:id/etiqueta", isAdmin, pedidoController.gerarEtiqueta)
router.post("/etiqueta/comprar", isAdmin, pedidoController.comprarEtiqueta)
router.post("/etiqueta/imprimir", isAdmin, pedidoController.imprimirEtiqueta)

module.exports = router
