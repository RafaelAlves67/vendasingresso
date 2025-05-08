import express from 'express';
import {
    getArrecadacaoMensal,
    getPercentualVendaIngressosPorEvento,
    getTotalArrecadado,
    getTotalArrecadadoPorEvento,
    listEventos_Vendas,
    listEventosAtivos,
    receitaPorMes,
    TotalIngressosVendidos,
} from '../controllers/RelatoriosController.js';

const relatorioRoute = express.Router();

relatorioRoute.get('/listaTotalIngressosVendidos/:usuario_id', TotalIngressosVendidos);
relatorioRoute.get('/listaEventosAtivos/:usuario_id', listEventosAtivos);
relatorioRoute.get('/getTotalArrecadado/:usuario_id', getTotalArrecadado);
relatorioRoute.get('/getTotalArrecadadoPorEvento/:usuario_id', getTotalArrecadadoPorEvento);
relatorioRoute.get('/getPercentualVendaIngressos/:usuario_id', getPercentualVendaIngressosPorEvento);
relatorioRoute.get('/getArrecadacaoMensal/:usuario_id', getArrecadacaoMensal);
relatorioRoute.get('/listaQuantidadeIngresso/:usuario_id', listEventos_Vendas);
relatorioRoute.get('/receitaMensal/:usuario_id', receitaPorMes);

export default relatorioRoute;
