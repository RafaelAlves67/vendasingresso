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

relatorioRoute.get('/listaTotalIngressosVendidos/:usuario_id/:id_evento?', TotalIngressosVendidos);
relatorioRoute.get('/listaEventosAtivos/:usuario_id/:id_evento?', listEventosAtivos);
relatorioRoute.get('/getTotalArrecadado/:usuario_id/:id_evento?', getTotalArrecadado);
relatorioRoute.get('/getTotalArrecadadoPorEvento/:usuario_id/:id_evento?', receitaPorEvento);
relatorioRoute.get('/getPercentualVendaIngressos/:usuario_id/:id_evento?', getPercentualVendaIngressosPorEvento);
relatorioRoute.get('/getArrecadacaoMensal/:usuario_id/:id_evento?', getArrecadacaoMensal);
relatorioRoute.get('/listaQuantidadeIngresso/:usuario_id/:id_evento?', listEventos_Vendas);
relatorioRoute.get('/receitaMensal/:usuario_id/:id_evento?', receitaPorMes);
relatorioRoute.get('/getProximosEventos/:usuario_id/:id_evento?', proximosEventos);
relatorioRoute.get('/listaEventos/:usuario_id/:id_evento?', listEventos);
relatorioRoute.get('/participantesPorEvento/:usuario_id/:id_evento?', participantesPorEvento);
relatorioRoute.get('/participantesPorMes/:usuario_id/:id_evento?', participantesPorMes);


export default relatorioRoute;
