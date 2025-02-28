import { DataTypes } from "sequelize";
import db from "../data/db.js";
import Evento from "./event.js";
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
      model: Evento,
      key: "id"
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE"
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // pode ser nulo caso o ingresso ainda não tenha sido comprado
    references: {
      model: User,
      key: "id"
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL"
  },
  lote: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM("disponível", "vendido", "utilizado"),
    defaultValue: "disponível"
  },
  qr_code: {
    type: DataTypes.STRING, // Pode armazenar um link para um QR Code gerado
    allowNull: false
  }
});

Evento.hasMany(Ticket, { foreignKey: "event_id", as: "ingressos" });
Ticket.belongsTo(Evento, { foreignKey: "event_id" });

User.hasMany(Ticket, { foreignKey: "user_id", as: "meusIngressos" });
Ticket.belongsTo(User, { foreignKey: "user_id" });

export default Ticket;
