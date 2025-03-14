import { DataTypes } from "sequelize";
import db from "../data/db.js";
import ShowHouse from "./Local.js";
import producer from "./Produtor.js";
import Ingresso from "./Ingresso.js";

const Event = db.define("Event", {
  evento_id: {
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
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dateStart: {
    type: DataTypes.DATEONLY,  // Apenas a data (YYYY-MM-DD)
    allowNull: false
  },

  dateEnd: {
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

  // A AVALIAR ESSE CAMPO
  is_sold_out: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  //
  status: {
    type: DataTypes.ENUM("Disponível", "Esgotado", "Cancelado", "Expirado"),
    defaultValue: "Disponível"
  },

  photos: {
    type: DataTypes.JSON,
    allowNull: true // Armazena URLs das fotos do evento
  },
  house_id: {
    type: DataTypes.INTEGER, // Certifique-se de que este tipo é o correto
    allowNull: false, 
}, 
usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
}
 
}, {
  tableName: "events",
  timestamps: true
});


export default Event;
