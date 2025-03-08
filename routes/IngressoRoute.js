import express from 'express'
import { authToken } from '../helpers/authToken.js'
import { registerTicket, editTicket } from '../controllers/ticketController.js'

// chamando a rota
const ingressoRoute = express.Router()

// rotas privada
ingressoRoute.post('/register', authToken, registerTicket)
ingressoRoute.put('/edit', authToken, editTicket)



export default ingressoRoute

