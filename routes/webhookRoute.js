// routes/webhook.js
import express from 'express';
import { webhookPagamento } from '../controllers/WebhookController.js';

const weebhookRoute = express.Router();

weebhookRoute.post('/pagamento', webhookPagamento);

export default weebhookRoute;
