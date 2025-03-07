import express from 'express'
import { authToken } from '../helpers/authToken.js'
import { registerTicket } from '../controllers/ticketController.js'

// chamando a rota
const ingressoRoute = express.Router()

// rotas privada
ingressoRoute.post('/register', authToken, registerTicket)



export default ingressoRoute

