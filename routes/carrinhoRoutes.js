const express = require("express")
const carrinhoController = require("../controllers/carrinhoController")

const router = express.Router()

// Todas as rotas de carrinho requerem autenticação


router.get("/", carrinhoController.obterCarrinho)
router.post("/adicionar", carrinhoController.adicionarAoCarrinho)
router.put("/atualizar", carrinhoController.atualizarCarrinho)
router.delete("/remover", carrinhoController.removerDoCarrinho)
router.delete("/limpar", carrinhoController.limparCarrinho)

module.exports = router
