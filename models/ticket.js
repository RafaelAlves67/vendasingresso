import { DataTypes } from "sequelize";
import db from "../data/db.js";
import Event from "./event.js";
import TicketLot from "./ticketLot.js";
import User from "./user.js";

const Ticket = db.define("Ticket", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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
  ticket_lot_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: TicketLot,
      key: "id"
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE"
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Pode ser nulo caso o ingresso ainda não tenha sido comprado
    references: {
      model: User,
      key: "id"
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL"
  },
  status: {
    type: DataTypes.ENUM("Disponível", "Vendido", "Utilizado"),
    defaultValue: "disponível"
  },
  qr_code: {
    type: DataTypes.STRING, // Pode armazenar um link para um QR Code gerado
    allowNull: false
  }
}, {
  tableName: "tickets",
  timestamps: true
});

// Relacionamentos
Event.hasMany(Ticket, { foreignKey: "event_id", as: "ingressos" });
Ticket.belongsTo(Event, { foreignKey: "event_id" });

TicketLot.hasMany(Ticket, { foreignKey: "ticket_lot_id", as: "ingressosDoLote" });
Ticket.belongsTo(TicketLot, { foreignKey: "ticket_lot_id" });

User.hasMany(Ticket, { foreignKey: "user_id", as: "meusIngressos" });
Ticket.belongsTo(User, { foreignKey: "user_id" });

export default Ticket;
