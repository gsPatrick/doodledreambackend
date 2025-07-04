const bcrypt = require("bcryptjs")
const { OAuth2Client } = require("google-auth-library")
const { Usuario } = require("../models")
const { gerarToken, verificarToken } = require("../utils/jwt")
const { enviarEmail } = require("../utils/email")
const crypto = require("crypto")

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const authService = {
  async autenticarComGoogle(googleToken) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      })

      const payload = ticket.getPayload()
      const { sub: googleId, email, name } = payload

      let usuario = await Usuario.findOne({ where: { googleId } })

      if (!usuario) {
        usuario = await Usuario.findOne({ where: { email } })
        if (usuario) {
          usuario.googleId = googleId
          await usuario.save()
        } else {
          usuario = await Usuario.create({
            nome: name,
            email,
            googleId,
            tipo: "cliente",
          })
        }
      }

      const token = gerarToken({ id: usuario.id, email: usuario.email })

      return {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
        },
        token,
      }
    } catch (error) {
      throw new Error("Erro na autenticação com Google: " + error.message)
    }
  },

  async autenticarComCredenciais(email, senha) {
    try {
      const usuario = await Usuario.findOne({ where: { email, ativo: true } })

      if (!usuario || !usuario.senhaHash) {
        throw new Error("Credenciais inválidas")
      }
 
      const senhaValida = await bcrypt.compare(senha, usuario.senhaHash)
      if (!senhaValida) {
        throw new Error("Credenciais inválidas")
      }

      const token = gerarToken({ id: usuario.id, email: usuario.email })

      return {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
        },
        token,
      }
    } catch (error) {
      throw error
    }
  }, 

  async registrarUsuario(dados) {
    try {
      const { nome, email, senha } = dados

      const usuarioExistente = await Usuario.findOne({ where: { email } })
      if (usuarioExistente) {
        throw new Error("Email já cadastrado")
      }

      const senhaHash = await bcrypt.hash(senha, 10)

      const usuario = await Usuario.create({
        nome,
        email,
        senhaHash,
        tipo: "admin",
      })

      const token = gerarToken({ id: usuario.id, email: usuario.email })

      return {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
        },
        token,
      }
    } catch (error) {
      throw error
    }
  },

  async recuperarSenha(email) {
    try {
      const usuario = await Usuario.findOne({ where: { email, ativo: true } })
      if (!usuario) {
        throw new Error("Usuário não encontrado")
      }

      const token = gerarToken({ id: usuario.id, tipo: "recuperacao" }, "1h")

      await enviarEmail(
        email,
        "Recuperação de Senha",
        `
        <h1>Recuperação de Senha</h1>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${process.env.FRONTEND_URL}/redefinir-senha?token=${token}">Redefinir Senha</a>
        <p>Este link expira em 1 hora.</p>
        `,
      )

      return { message: "Email de recuperação enviado" }
    } catch (error) {
      throw error
    }
  },

  async alterarSenha(token, novaSenha) {
    try {
      const decoded = verificarToken(token)
      if (decoded.tipo !== "recuperacao") {
        throw new Error("Token inválido")
      }

      const usuario = await Usuario.findByPk(decoded.id)
      if (!usuario) {
        throw new Error("Usuário não encontrado")
      }

      const senhaHash = await bcrypt.hash(novaSenha, 10)
      usuario.senhaHash = senhaHash
      await usuario.save()

      return { message: "Senha alterada com sucesso" }
    } catch (error) {
      throw error
    }
  },

  async criarContaGhost(nome, email) {
    try {
      let usuario = await Usuario.findOne({ where: { email } })
      
      if (usuario) {
        // Se o usuário já existe mas não tem senha, retorna o usuário
        if (!usuario.senhaHash) {
          const token = gerarToken({ id: usuario.id, email: usuario.email })
          return { usuario, token, isNew: false }
        }
        throw new Error("Email já cadastrado")
      }

      // Gerar senha aleatória
      const senhaAleatoria = crypto.randomBytes(16).toString("hex")
      const senhaHash = await bcrypt.hash(senhaAleatoria, 10)

      usuario = await Usuario.create({
        nome,
        email,
        senhaHash,
        tipo: "cliente",
      })

      // Enviar email com link para definir senha
      const tokenRecuperacao = gerarToken({ id: usuario.id, tipo: "recuperacao" }, "24h")
      await enviarEmail(
        email,
        "Bem-vindo ao DoodleDreams - Complete seu cadastro",
        `
        <h1>Bem-vindo ao DoodleDreams!</h1>
        <p>Olá ${nome},</p>
        <p>Sua conta foi criada com sucesso. Para definir sua senha e ter acesso completo à sua conta, clique no link abaixo:</p>
        <a href="${process.env.FRONTEND_URL}/definir-senha?token=${tokenRecuperacao}">Definir Senha</a>
        <p>Este link expira em 24 horas.</p>
        <p>Se você não solicitou a criação desta conta, por favor ignore este email.</p>
        `
      )

      const token = gerarToken({ id: usuario.id, email: usuario.email })

      return {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
        },
        token,
        isNew: true
      }
    } catch (error) {
      throw error
    }
  }
}

module.exports = authService
