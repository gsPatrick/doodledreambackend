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
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    itens: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
  },
  {
    tableName: "carrinhos",
    timestamps: true,
  },
)

module.exports = Carrinho
