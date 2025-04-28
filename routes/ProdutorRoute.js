import express from 'express';
import { registerProducer } from '../controllers/ProdutorController.js';

const producerRoute = express.Router();

producerRoute.post('/register', registerProducer);

export default producerRoute;
