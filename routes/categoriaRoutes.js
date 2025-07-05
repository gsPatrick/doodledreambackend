const express = require('express');
const router = express.Router();
const carrinhoController = require('../controllers/carrinhoController');
const { autenticacaoOpcional, verifyToken } = require('../middleware/auth'); // Importe ambos

// Rotas públicas (ou com autenticação opcional)
router.get('/', autenticacaoOpcional, carrinhoController.obterCarrinho);
router.post('/adicionar', autenticacaoOpcional, carrinhoController.adicionarAoCarrinho);
router.put('/atualizar', autenticacaoOpcional, carrinhoController.atualizarCarrinho);
router.delete('/remover', autenticacaoOpcional, carrinhoController.removerDoCarrinho);
router.delete('/limpar', autenticacaoOpcional, carrinhoController.limparCarrinho);

// Rota de migração - PRECISA de autenticação estrita
router.post('/migrar', verifyToken, carrinhoController.migrarCarrinho);

module.exports = router;