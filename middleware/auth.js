const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const config = require('../config/config');

/**
 * Middleware para verificar token JWT
 */

const autenticacaoOpcional = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization")
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "")
      const decoded = verificarToken(token)
      const usuario = await Usuario.findByPk(decoded.id)

      if (usuario) {
        // Adiciona o usuário à requisição se o token for válido
        req.user = usuario.toJSON()
      }
    }
  } catch (error) {
    // Se o token for inválido, apenas ignoramos e continuamos como visitante
    // Não é necessário fazer nada aqui.
  } finally {
    // Continua para a próxima rota, com ou sem req.user
    next()
  }
}

const verifyToken = async (req, res, next) => {
    try {
        // Pegar o token do header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ erro: 'Token não fornecido' });
        }

        const token = authHeader.split(' ')[1];

        // Verificar token
        const decoded = jwt.verify(token, config.jwtSecret);

        // Buscar usuário
        const usuario = await Usuario.findByPk(decoded.id);

        if (!usuario) {
            return res.status(401).json({ erro: 'Usuário não encontrado' });
        }

        // Adicionar usuário ao request – manter compatibilidade com controladores que usam `req.usuario`
        req.user = usuario
        req.usuario = usuario

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ erro: 'Token inválido ou expirado' });
        }

        next(error);
    }
};

/**
 * Middleware para verificar se o usuário é administrador
 */
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    if (req.user.tipo !== 'admin') {
        return res.status(403).json({ erro: 'Acesso não autorizado' });
    }

    next();
};

module.exports = {
    verifyToken,
    autenticacaoOpcional ,
    isAdmin
}; 