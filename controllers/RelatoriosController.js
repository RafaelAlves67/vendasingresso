import Event from "../models/event.js";
import Ingresso from "../models/Ingresso.js";
import Produtor from "../models/Produtor.js";
import ItemCompra from "../models/ItemCompra.js";
import Compra from "../models/Compra.js";
import { Op, fn, col, literal, where } from 'sequelize';

Event.hasMany(Ingresso, { foreignKey: 'evento_id', as: 'ingressos' });
Event.belongsTo(Produtor, { foreignKey: 'produtor_id' });
Event.hasMany(Ingresso, { foreignKey: 'evento_id' });

export async function TotalIngressosVendidos(req, res) {
    try {
        const { usuario_id } = req.params;

        // Realizar a consulta para somar todos os ingressos vendidos
        const totalIngressosVendidos = await Event.findAll({
            where: {
                produtor_id: {
                    [Op.not]: null // Garantir que o produtor_id não seja nulo
                }
            },
            include: [
                {
                    model: Produtor,
                    as: 'produtor',
                    where: {
                        usuario_id: usuario_id // Filtrar eventos com base no usuário do produtor
                    },
                    attributes: [] // Não incluir atributos do produtor diretamente
                },
                {
                    model: Ingresso,
                    as: 'ingressos',
                    attributes: [] // Não incluir atributos dos ingressos diretamente
                }
            ],
            attributes: [
                // Soma de todos os ingressos vendidos, substituindo null por 0
                [fn('SUM', fn('COALESCE', col('ingressos.quantidade_vendida'), 0)), 'total_ingressos_vendidos']
            ],
            raw: true // Deixar o resultado o mais simples possível (sem modelos de Sequelize)
        });

        // Se não houver nenhum evento, retornar um total de 0
        const total = totalIngressosVendidos[0] ? totalIngressosVendidos[0].total_ingressos_vendidos : 0;

        return res.status(200).json({ total_ingressos_vendidos: total });

    } catch (error) {
        console.log("Erro na rota de listar os eventos e suas vendas =>", error);
        return res.status(500).json({ msg: "Erro na rota de listar os eventos e suas vendas", error });
    }
}

export async function listEventos_Vendas(req, res) {
    try {
        const { usuario_id } = req.params;

        const eventos = await Event.findAll({
            where: {
                produtor_id: {
                    [Op.not]: null // Garantir que o produtor_id não seja nulo
                }
            },
            include: [
                {
                    model: Produtor,
                    as: 'produtor',
                    where: {
                        usuario_id: usuario_id // Filtrar eventos com base no usuário do produtor
                    },
                    attributes: [] // Não incluir atributos do produtor diretamente
                },
                {
                    model: Ingresso,
                    as: 'ingressos',
                    attributes: [] // Não incluir atributos dos ingressos diretamente
                }
            ],
            attributes: [
                'evento_id', // Campo de identificação do evento
                'name', // Corrigido para 'name', que é o nome correto da coluna no modelo
                [fn('SUM', col('ingressos.quantidade_vendida')), 'total_ingressos_vendidos'] // Soma das quantidades vendidas
            ],
            group: ['Event.evento_id', 'Event.name'], // Corrigido para 'name'
            raw: true // Deixar o resultado o mais simples possível (sem modelos de Sequelize)
        });

        if (!eventos || eventos.length === 0) {
            return res.status(404).json({ msg: "Nenhum evento encontrado para este usuário." });
        }

        return res.status(200).json(eventos);

    } catch (error) {
        console.log("Erro na rota de listar os eventos e suas vendas =>", error);
        return res.status(500).json({ msg: "Erro na rota de listar os eventos e suas vendas", error });
    }
}

export async function listEventosAtivos(req, res) {
    try {
        const { usuario_id } = req.params;

        // Obter a data atual
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const totalEventosAtivos = await Event.count({
            include: [
                {
                    model: Produtor,
                    where: {
                        usuario_id: usuario_id
                    },
                    required: true,
                    attributes: []
                },
            ],
            where: {
                dateStart: {
                    [Op.gte]: currentDate
                }
            }
        });

        return res.status(200).json({ totalEventosAtivos });

    } catch (error) {
        console.log("Erro na rota de contar eventos ativos do usuário =>", error);
        return res.status(500).json({ msg: "Erro na rota de contar eventos ativos do usuário", error });
    }
}

export async function getTotalArrecadado(req, res) {
    try {
        const { usuario_id } = req.params;

        const resultado = await ItemCompra.findAll({
            include: [
                {
                    model: Ingresso,
                    include: [
                        {
                            model: Event,
                            include: [
                                {
                                    model: Produtor,
                                    where: {
                                        usuario_id: usuario_id
                                    },
                                    attributes: [],
                                    required: true
                                }
                            ],
                            attributes: [],
                            required: true
                        }
                    ],
                    attributes: [],
                    required: true
                },
                {
                    model: Compra,
                    where: {
                        status: 'Aprovada'
                    },
                    attributes: [],
                    required: true
                }
            ],
            attributes: [
                [fn('SUM', literal('quantidade * valor_unitario')), 'total_arrecadado']
            ],
            raw: true
        });

        const totalArrecadado = resultado[0]?.total_arrecadado || 0;

        return res.status(200).json({ totalArrecadado });

    } catch (error) {
        console.log("Erro ao calcular total arrecadado =>", error);
        return res.status(500).json({ msg: "Erro ao calcular total arrecadado", error });
    }
}

export async function getTotalArrecadadoPorEvento(req, res) {
    try {
        const { usuario_id } = req.params;

        const resultados = await ItemCompra.findAll({
            include: [
                {
                    model: Ingresso,
                    include: [
                        {
                            model: Event,
                            include: [
                                {
                                    model: Produtor,
                                    where: { usuario_id },
                                    attributes: [],
                                    required: true
                                }
                            ],
                            attributes: [], // ⚠️ evitar trazer colunas aqui
                            required: true
                        }
                    ],
                    attributes: [], // ⚠️ isso resolve o problema do GROUP BY
                    required: true
                },
                {
                    model: Compra,
                    where: { status: 'Aprovada' },
                    attributes: [],
                    required: true
                }
            ],
            attributes: [
                [col('Ingresso.Event.evento_id'), 'evento_id'],
                [col('Ingresso.Event.name'), 'nome_evento'],
                [fn('SUM', literal('quantidade * valor_unitario')), 'total_arrecadado']
            ],
            group: ['Ingresso.Event.evento_id', 'Ingresso.Event.name'],
            raw: true
        });

        return res.status(200).json(resultados);
    } catch (error) {
        console.error("Erro ao calcular total arrecadado por evento =>", error);
        return res.status(500).json({ msg: "Erro ao calcular total arrecadado por evento", error });
    }
}

export async function getPercentualVendaIngressosPorEvento(req, res) {
    try {
        const { usuario_id } = req.params;

        const resultados = await ItemCompra.findAll({
            include: [
                {
                    model: Ingresso,
                    include: [
                        {
                            model: Event,
                            include: [
                                {
                                    model: Produtor,
                                    where: { usuario_id },
                                    attributes: [],
                                    required: true
                                }
                            ],
                            attributes: [], // evitar trazer colunas desnecessárias
                            required: true
                        }
                    ],
                    attributes: [], // evitar conflito no GROUP BY
                    required: true
                },
                {
                    model: Compra,
                    where: { status: 'Aprovada' },
                    attributes: [],
                    required: true
                }
            ],
            attributes: [
                [col('Ingresso.titulo'), 'nome_ingresso'],
                [col('Ingresso.Event.evento_id'), 'evento_id'],
                [col('Ingresso.Event.name'), 'nome_evento'],
                [fn('SUM', col('quantidade')), 'quantidade_vendida']
            ],
            group: ['Ingresso.ingresso_id', 'Ingresso.titulo', 'Ingresso.Event.evento_id', 'Ingresso.Event.name'],
            raw: true
        });

        // Agrupar por evento e calcular total vendido por evento
        const dadosComPercentual = [];
        const totalPorEvento = {};

        for (const row of resultados) {
            const eventoId = row.evento_id;

            if (!totalPorEvento[eventoId]) {
                totalPorEvento[eventoId] = 0;
            }

            totalPorEvento[eventoId] += parseInt(row.quantidade_vendida, 10);
        }

        for (const row of resultados) {
            const totalEvento = totalPorEvento[row.evento_id];
            const percentual = (parseInt(row.quantidade_vendida, 10) / totalEvento) * 100;

            dadosComPercentual.push({
                evento_id: row.evento_id,
                nome_evento: row.nome_evento,
                nome_ingresso: row.nome_ingresso,
                quantidade_vendida: parseInt(row.quantidade_vendida, 10),
                percentual_vendido: percentual.toFixed(2) + '%'
            });
        }

        return res.status(200).json(dadosComPercentual);
    } catch (error) {
        console.error("Erro ao calcular percentual de venda dos ingressos =>", error);
        return res.status(500).json({ msg: "Erro ao calcular percentual de venda dos ingressos", error });
    }
}

export async function getArrecadacaoMensal(req, res) {
    try {
        const { usuario_id } = req.params; // Acesso correto ao parâmetro

        const anoAtual = new Date().getFullYear();
        const mesAtual = new Date().getMonth(); // Mês atual (0-11)

        // Buscar a arrecadação mensal
        const resultados = await ItemCompra.findAll({
            include: [
                {
                    model: Ingresso,
                    include: [
                        {
                            model: Event,
                            include: [
                                {
                                    model: Produtor,
                                    where: { usuario_id },
                                    attributes: [],
                                    required: true
                                }
                            ],
                            attributes: [],
                            required: true
                        }
                    ],
                    attributes: [],
                    required: true
                },
                {
                    model: Compra,
                    where: {
                        status: 'Aprovada',
                        data_compra: {
                            [Op.gte]: new Date(`${anoAtual}-01-01`), // A partir de janeiro do ano atual
                            [Op.lt]: new Date(anoAtual, mesAtual + 1, 0).setHours(23, 59, 59, 999), // Até o final do mês atual
                        }
                    },
                    attributes: [],
                    required: true
                }
            ],
            attributes: [
                [fn('DATE_TRUNC', 'month', col('Compra.data_compra')), 'mes'],
                [fn('SUM', literal('quantidade * valor_unitario')), 'total_arrecadado']
            ],
            group: [fn('DATE_TRUNC', 'month', col('Compra.data_compra'))],
            order: [[fn('DATE_TRUNC', 'month', col('Compra.data_compra')), 'ASC']],
            raw: true
        });

        // Criar um array com todos os meses do ano até o mês atual
        const mesesDoAno = [];
        for (let i = 0; i <= mesAtual; i++) { // Até o mês atual
            const mes = new Date(anoAtual, i, 1); // Cria um objeto de data para o primeiro dia de cada mês
            mesesDoAno.push({
                mes: mes.toISOString().split('T')[0], // Formato 'YYYY-MM-DD'
                total_arrecadado: 0 // Valor inicial 0
            });
        }

        // Preencher os dados de arrecadação nos meses correspondentes
        resultados.forEach(result => {
            // Converter para formato de string 'YYYY-MM-DD'
            const mes = new Date(result.mes).toISOString().split('T')[0];
            const index = mesesDoAno.findIndex(m => m.mes === mes);
            if (index !== -1) {
                mesesDoAno[index].total_arrecadado = result.total_arrecadado || 0;
            }
        });

        return res.status(200).json(mesesDoAno);
    } catch (error) {
        console.error("Erro ao calcular arrecadação mensal =>", error);
        return res.status(500).json({ msg: "Erro ao calcular arrecadação mensal", error });
    }
}
