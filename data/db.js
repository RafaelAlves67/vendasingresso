import { Sequelize } from "sequelize";
import { configDotenv } from "dotenv";
configDotenv()

// variaveis banco
const db_name = process.env.DB_NAME 
const db_user = process.env.DB_USER 
const db_pass = process.env.DB_PASS 
const db_host = process.env.DB_HOST

// criando conexão
const db = new Sequelize(db_name, db_user, db_pass, {
    host: db_host,
    dialect: 'postgres'
})

// conexão assincrona com banco
async function connectDB(){
    try{
        await db.authenticate();
        console.log("Banco de dados conectado!")
    }catch(error){
        console.log("Erro ao conectar com banco de dados => " , error)
    }
}

// chamando função
connectDB();

// exportando
export default db