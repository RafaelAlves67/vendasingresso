import express from 'express'
import { authToken } from '../helpers/authToken.js'
import {deleteHouse, editHouse, getSearchHouse, getHouseAll, registerHouse } from '../controllers/LocalController.js'

// chamando a rota
const houseRoute = express.Router()

// rotas privada
houseRoute.post('/register', authToken, registerHouse)
houseRoute.put('/edit', authToken, editHouse)
houseRoute.delete('/delete/:id', authToken, deleteHouse)
houseRoute.get('/', authToken, getHouseAll)
houseRoute.get('/:name', authToken, getSearchHouse)


export default houseRoute

