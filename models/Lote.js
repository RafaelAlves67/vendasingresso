import { DataTypes } from "sequelize";
import db from "../data/db.js";
import Ingresso from './Ingresso.js'

const Lote = db.define('Lote', {
  lote_id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
    allowNull: false
},
  data_termino_vendas: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  hora_termino_vendas: {
    type: DataTypes.TIME,
    allowNull: false,
  }
});



export default Lote;
