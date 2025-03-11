import express from 'express'
import { authToken } from '../helpers/authToken.js'
import { registerTicket, editTicket, listarIngressosPorEvento, deleteTicket } from '../controllers/ticketController.js'

// chamando a rota
const ingressoRoute = express.Router()

// rotas privada
ingressoRoute.post('/register', authToken, registerTicket)
ingressoRoute.put('/edit', authToken, editTicket)
ingressoRoute.get('/ingressos', authToken, listarIngressosPorEvento)
ingressoRoute.delete('/delete/:id', authToken, deleteTicket)



export default ingressoRoute

