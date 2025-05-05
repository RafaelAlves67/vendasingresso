import express from 'express'
import { authToken } from '../helpers/authToken.js' 
import { processarPagamento } from '../controllers/PagamentoController.js'

const pagamentoRoute = express.Router()

pagamentoRoute.post('/processar/:compra_id' , authToken, processarPagamento)


export default pagamentoRoute