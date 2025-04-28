import express from 'express';
import { buscarEnderecoPorCep } from '../controllers/viaCepController.js';

const cepRoute = express.Router();

// Rota pública para buscar o endereço por CEP
cepRoute.get('/cep/:cep', buscarEnderecoPorCep);

export default cepRoute;
