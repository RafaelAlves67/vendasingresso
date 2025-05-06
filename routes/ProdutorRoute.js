import express from 'express';
import {editProducer, registerProducer} from '../controllers/ProdutorController.js';

const producerRoute = express.Router();

producerRoute.post('/register', registerProducer);
producerRoute.post('/edit', editProducer);

export default producerRoute;
