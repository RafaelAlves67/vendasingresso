import { DataTypes, Sequelize } from 'sequelize';
import sequelize from '../data/db.js';

const Compra = sequelize.define('Compra', {
  compra_id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false
    },
  data_compra: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
  valor_total: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

  status: {
    type: DataTypes.ENUM('Ativa', 'Cancelada'),
    allowNull: true,
    defaultValue: 'Ativa'
  }
});

export default Compra;
