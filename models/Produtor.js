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
      type: DataTypes.STRING(255),
    },

    usuario_id:{
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    timestamps: true, // Inclui createdAt e updatedAt automaticamente
    tableName: 'produtores', // Define o nome da tabela explicitamente
  });
  
  export default Produtor;
  
