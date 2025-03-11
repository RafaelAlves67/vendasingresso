import { DataTypes, Sequelize } from "sequelize";
import db from "../data/db.js";
import TicketLot from "./Lote.js";
import User from "./user.js";

const Ingresso = db.define('Ingresso', {
  ingresso_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantidade_total: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantidade_vendida: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  valor: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  meia_entrada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  periodo_vendas_tipo: {
    type: DataTypes.ENUM('Por Data', 'Por Lote'),
    defaultValue: 'Por Data',
    allowNull: false,
  },
  data_inicio_vendas: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hora_inicio_vendas: {
    type: DataTypes.TIME,
    allowNull: false
  },
  data_termino_vendas: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hora_termino_vendas: {
    type: DataTypes.TIME,
    allowNull: false
  },
  quantidade_minima_por_compra: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantidade_maxima_por_compra: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
  },
  visivel: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

});





export default Ingresso;
