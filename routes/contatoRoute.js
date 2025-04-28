import express from 'express';
import { enviarFormulario } from '../controllers/contatoController.js';

const contatoRoute = express.Router();

contatoRoute.post('/contato', enviarFormulario);

export default contatoRoute;
