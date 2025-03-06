import express from 'express'
import { deleteEvent, editEvent, registerEvent, getSearchEvent, getEventAll, getEventsByHouse, getEventsByStatus} from '../controllers/eventController.js'
import {authToken} from '../helpers/authToken.js'

const eventRoute = express.Router() 


eventRoute.post('/register', authToken, registerEvent)
eventRoute.put('/edit', authToken, editEvent)
eventRoute.delete('/delete/:id', authToken, deleteEvent)
eventRoute.get('/search/:name', authToken, getSearchEvent)
eventRoute.get('/', authToken, getEventAll)
eventRoute.get('/searchHouse/:id', authToken, getEventsByHouse)
eventRoute.get('/searchStats/:status', authToken, getEventsByStatus)

export default eventRoute