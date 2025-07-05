// routes/carrinhoRoutes.js

const express = require("express")
const carrinhoController = require("../controllers/carrinhoController")
const { autenticacaoOpcional } = require("../middleware/auth") // IMPORTE O NOVO MIDDLEWARE

const router = express.Router()

// APLIQUE O MIDDLEWARE A TODAS AS ROTAS DO CARRINHO
router.use(autenticacaoOpcional)

router.get("/", carrinhoController.obterCarrinho)
router.post("/adicionar", carrinhoController.adicionarAoCarrinho)
router.post("/remover", carrinhoController.removerDoCarrinho) // Mudei para POST para consistência com body
router.put("/atualizar", carrinhoController.atualizarCarrinho)
router.delete("/limpar", carrinhoController.limparCarrinho)

module.exports = router