import express from 'express'
import cors from 'cors'
// BANCO DE DADOS
import db from './data/db.js'
// MODELS
import User from './models/user.js'
import showHouse from './models/Local.js'
import Event from './models/event.js'
import Ingresso from './models/Ingresso.js'
import producer from './models/Produtor.js'
import Compra from './models/Compra.js'
import ItemCompra from './models/ItemCompra.js'

//ASSOCIAÇÕES
import setupAssociations from './associações/index.js'
// ROTAS
import userRoute from './routes/userRoute.js'
import houseRoute from './routes/houseRoute.js'
import eventRoute from './routes/eventRoute.js'
import ingressoRoute from './routes/IngressoRoute.js'
import compraRoute from './routes/compraRoute.js'
import pagamentoRoute from './routes/pagamentoRoute.js'
import weebhookRoute from './routes/webhookRoute.js'
import viaCepRoute from './routes/viaCepRouter.js';
import contatoRoute from './routes/contatoRoute.js';
import ProdutorRoute from './routes/ProdutorRoute.js';
import RelatoriosRoute from './routes/RelatoriosRoute.js';

// chamando o express
const app = express()


// middlewares
app.use(cors())
app.use(express.json())

// rotas
app.use('/user', userRoute)
app.use('/house', houseRoute)
app.use('/event', eventRoute)
app.use('/ingresso', ingressoRoute, compraRoute)
app.use('/compra', pagamentoRoute)
app.use('/weebhook', weebhookRoute)
app.use('/api', viaCepRoute)
app.use('/form', contatoRoute)
app.use('/produtor', ProdutorRoute)
app.use('/graficos', RelatoriosRoute)


// ativando servidor
const port = 3000

async function startServer() {
    try {
        setupAssociations();
        await db.sync({alter: true}); // Aguarda a sincronização do banco antes de iniciar o servidor
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
