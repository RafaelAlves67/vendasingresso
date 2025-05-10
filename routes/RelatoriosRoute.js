import express from 'express';
import {
    getArrecadacaoMensal,
    getPercentualVendaIngressosPorEvento,
    getTotalArrecadado,
    listEventos,
    listEventos_Vendas,
    listEventosAtivos,
    participantesPorEvento,
    participantesPorMes,
    proximosEventos,
    receitaPorEvento,
    receitaPorMes,
    TotalIngressosVendidos,
} from '../controllers/RelatoriosController.js';

const relatorioRoute = express.Router();

relatorioRoute.get('/listaTotalIngressosVendidos/:usuario_id', TotalIngressosVendidos);
relatorioRoute.get('/listaEventosAtivos/:usuario_id', listEventosAtivos);
relatorioRoute.get('/getTotalArrecadado/:usuario_id', getTotalArrecadado);
relatorioRoute.get('/getTotalArrecadadoPorEvento/:usuario_id', receitaPorEvento);
relatorioRoute.get('/getPercentualVendaIngressos/:usuario_id', getPercentualVendaIngressosPorEvento);
relatorioRoute.get('/getArrecadacaoMensal/:usuario_id', getArrecadacaoMensal);
relatorioRoute.get('/listaQuantidadeIngresso/:usuario_id', listEventos_Vendas);
relatorioRoute.get('/receitaMensal/:usuario_id', receitaPorMes);
relatorioRoute.get('/getProximosEventos/:usuario_id', proximosEventos);
relatorioRoute.get('/listaEventos/:usuario_id', listEventos);
relatorioRoute.get('/participantesPorEvento/:usuario_id', participantesPorEvento);
relatorioRoute.get('/participantesPorMes/:usuario_id/:id_evento?', participantesPorMes);


export default relatorioRoute;
