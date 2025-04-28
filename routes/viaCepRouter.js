import express from 'express';
import { buscarEnderecoPorCep } from '../controllers/viaCepController.js';

const cepRoute = express.Router();

// Rota p�blica para buscar o endere�o por CEP
cepRoute.get('/cep/:cep', buscarEnderecoPorCep);

export default cepRoute;
