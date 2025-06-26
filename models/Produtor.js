import { DataTypes } from "sequelize";
import db from "../data/db.js";

const Produtor = db.define('Produtores', {
    produtor_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },

    usuario_id:{
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    timestamps: true, // Inclui createdAt e updatedAt automaticamente
    tableName: 'produtores', // Define o nome da tabela explicitamente
  });
  
  export default Produtor;
  
