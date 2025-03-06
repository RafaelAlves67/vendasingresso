import { DataTypes } from "sequelize";
import db from "../data/db.js";
import Event from "./event.js";

const TicketLot = db.define("TicketLot", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Event,
      key: "id"
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE"
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false // Ex: "1º Lote", "VIP", "Meia-entrada"
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  max_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false // Número total de ingressos disponíveis neste lote
  },
  sold_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0 // Número de ingressos vendidos
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false // Quando este lote começa a ser vendido
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false // Quando este lote para de ser vendido
  },
  status: {
    type: DataTypes.ENUM("Ativo", "Esgotado", "Expirado"),
    defaultValue: "Ativo"
  }
}, {
  tableName: "ticket_lots",
  timestamps: true
});

// Relacionamento com Evento
Event.hasMany(TicketLot, { foreignKey: "event_id", as: "lots" });
TicketLot.belongsTo(Event, { foreignKey: "event_id" });

export default TicketLot;
