import { DataTypes } from "sequelize";
import db from "../data/db.js";
import showHouse from "./showHouse.js";

const Event = db.define("Evento", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  house_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "casas_de_show",
      key: "house_id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },
  ticket_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  ticket_lots: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  max_tickets_per_person: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  is_sold_out: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM("Disponível", "Esgotado", "Cancelado", "Expirado"),
    defaultValue: "Disponível",
  },

  photos: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: "eventos",
  timestamps: true,
});

Event.belongsTo(showHouse, { foreignKey: "house_id", as: "casaDeShow" });

export default Event;
