import express from 'express';
import {
    deleteEvent,
    editEvent,
    registerEvent,
    getSearchEvent,
    getEventAll,
    getEventsByHouse,
    getEventsByStatus,
    getEventById
} from '../controllers/eventController.js';
import { authToken } from '../helpers/authToken.js';
import multer from 'multer';

// Configurar o multer para aceitar o campo 'photos' como arquivo
const upload = multer({
    dest: 'uploads/', // O diretório onde você deseja salvar os arquivos
}).single('photos'); // 'photos' é o nome do campo onde o arquivo será enviado

const eventRoute = express.Router();

// Rota de registro de evento, onde você processa o formulário
eventRoute.post('/register', authToken, upload, registerEvent);
eventRoute.put('/edit', authToken, editEvent)
eventRoute.delete('/delete/:id', authToken, deleteEvent)
eventRoute.get('/search/:name', authToken, getSearchEvent)
eventRoute.get('/', getEventAll)
eventRoute.get('/event/:id', getEventById);
eventRoute.get('/searchHouse/:id', authToken, getEventsByHouse)
eventRoute.get('/searchStats/:status', authToken, getEventsByStatus)

export default eventRoute