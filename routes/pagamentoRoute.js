import express from 'express'
import { authToken } from '../helpers/authToken.js' 
import { processarPagamento } from '../controllers/PagamentoController.js'

const pagamentoRoute = express.Router()

pagamentoRoute.post('/processar' , authToken, processarPagamento)


export default pagamentoRoute