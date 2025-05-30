import express from 'express'
import { authToken } from '../helpers/authToken.js'
import { cancelarCompra, criarCompra, listarComprasPorData, listarIngressosComprados, validarIngresso } from '../controllers/CompraController.js'

const compraRoute = express.Router() 

compraRoute.post('/compra', authToken, criarCompra)
compraRoute.get('/list/ingressos', authToken, listarIngressosComprados)
compraRoute.put('/cancelar', authToken, cancelarCompra)
compraRoute.get('/list/ingressos/date', authToken, listarComprasPorData)
compraRoute.post('/autenticate', authToken, validarIngresso)

export default compraRoute