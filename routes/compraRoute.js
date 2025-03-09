import express from 'express'
import { authToken } from '../helpers/authToken.js'
import { criarCompra, listarIngressosComprados } from '../controllers/CompraController.js'

const compraRoute = express.Router() 

compraRoute.post('/compra', authToken, criarCompra)
compraRoute.get('/list', authToken, listarIngressosComprados)

export default compraRoute