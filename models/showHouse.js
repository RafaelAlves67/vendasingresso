import { DataTypes } from "sequelize";
import db from "../data/db.js";

const showHouse = db.define("House", {
    house_id: {  
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,  
      },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  zip_code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  photos: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: "casas_de_show",
  timestamps: true,
});

export default showHouse;
