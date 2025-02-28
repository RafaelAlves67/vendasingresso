import express from 'express'
import { authToken } from '../helpers/authToken.js'
import {deleteHouse, editHouse, registerHouse } from '../controllers/houseController.js'

// chamando a rota
const houseRoute = express.Router()

// rotas privada
houseRoute.post('/register', authToken, registerHouse)
houseRoute.put('/edit', authToken, editHouse)
houseRoute.delete('/delete/:id', authToken, deleteHouse)


export default houseRoute

