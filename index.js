import express from 'express'
import cors from 'cors'
// BANCO DE DADOS
import db from './data/db.js'
// MODELS
import User from './models/user.js'
import showHouse from './models/showHouse.js'
import Event from './models/event.js'
import Ticket from './models/ticket.js'
// ROTAS
import userRoute from './routes/userRoute.js'
import houseRoute from './routes/houseRoute.js'
import eventRoute from './routes/eventRoute.js'

// chamando o express
const app = express()


// middlewares
app.use(cors())
app.use(express.json())

// rotas
app.use('/user', userRoute)
app.use('/house', houseRoute)
app.use('/event', eventRoute)

// ativando servidor
const port = 3000

async function startServer() {
    try {
        await db.sync(); // Aguarda a sincronização do banco antes de iniciar o servidor
        console.log("Banco sincronizado...");

        app.listen(port, () => {
            console.log(`Servidor rodando na porta ${port} 🚀`);
        });
    } catch (error) {
        console.error("Erro ao sincronizar banco =>", error);
    }
}

// Chamando a função
startServer();

