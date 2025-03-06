import { DataTypes } from "sequelize";
import db from "../data/db.js";
import ShowHouse from "./showHouse.js";

const Event = db.define("Event", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,  // Apenas a data (YYYY-MM-DD)
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,  // Apenas a hora (HH:MM:SS)
    allowNull: false
  },
  endTime:{
    type: DataTypes.TIME,  // Apenas a hora (HH:MM:SS)
    allowNull: false
  },
  house_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ShowHouse,
      key: "house_id"
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE"
  },
  is_sold_out: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM("Disponível", "Esgotado", "Cancelado", "Expirado"),
    defaultValue: "Disponível"
  },
  photos: {
    type: DataTypes.JSON,
    allowNull: true // Armazena URLs das fotos do evento
  },
  qtde_ticket: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  available_tickets: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  CtrlLote: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
}, {
  tableName: "events",
  timestamps: true
});

// Relacionamento com Casa de Show
Event.belongsTo(ShowHouse, { foreignKey: "house_id", as: "casaDeShow" });


export default Event;
