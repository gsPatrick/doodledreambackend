const express = require("express")
const carrinhoController = require("../controllers/carrinhoController")
const { verifyToken } = require("../middleware/auth")

const router = express.Router()

// Todas as rotas de carrinho requerem autenticação
router.use(verifyToken)

router.get("/", carrinhoController.obterCarrinho)
router.post("/adicionar", carrinhoController.adicionarAoCarrinho)
router.put("/atualizar", carrinhoController.atualizarCarrinho)
router.delete("/remover", carrinhoController.removerDoCarrinho)
router.delete("/limpar", carrinhoController.limparCarrinho)

module.exports = router
