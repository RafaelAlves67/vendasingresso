import { DataTypes } from 'sequelize';
import sequelize from '../data/db.js';

const ItemCompra = sequelize.define('ItemCompra', {
  itemCompra_id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
    allowNull: false
},
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  valor_unitario: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  compra_id:{
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ingresso_id:{
    type: DataTypes.INTEGER,
    allowNull: false
  },
  qr_code: {type: DataTypes.TEXT, allowNull: true},
  usado: { type: DataTypes.BOOLEAN, defaultValue: false },

});

export default ItemCompra;
