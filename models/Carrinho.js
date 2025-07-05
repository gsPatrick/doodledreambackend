// models/Carrinho.js

const { DataTypes } = require("sequelize")
const { sequelize } = require("../config/database")

const Carrinho = sequelize.define(
  "Carrinho",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // MUITO IMPORTANTE: MUDANÇA AQUI
    identificadorSessao: {
      type: DataTypes.STRING, // Mudamos para STRING para aceitar UUIDs de visitantes
      allowNull: false,
      unique: true, // Cada sessão/usuário tem um único carrinho
    },
    itens: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    // Opcional: manter o vínculo se o usuário estiver logado
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Permite nulo para visitantes
        references: {
            model: "usuarios",
            key: "id",
        },
        onDelete: 'SET NULL' // Se o usuário for deletado, o carrinho pode permanecer
    }
  },
  {
    tableName: "carrinhos",
    timestamps: true,
  },
)

module.exports = Carrinho