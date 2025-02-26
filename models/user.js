import { DataTypes } from "sequelize";
import db from '../data/db.js'

const User = db.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    phone: {type: DataTypes.INTEGER(11), allowNull: false, unique: true},
    birth: {type: DataTypes.DATE, allowNull: false},
    role: {type: DataTypes.ENUM(['Admin', 'Usuario']), defaultValue: "Usuario"}
  }, { 
    tableName: 'users', // Nome da tabela no banco
    timestamps: true // createdAt e updatedAt
})

export default User