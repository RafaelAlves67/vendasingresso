import Event from "../models/event.js";
import Ingresso from "../models/Ingresso.js";
import Produtor from "../models/Produtor.js";
import ItemCompra from "../models/ItemCompra.js";
import Compra from "../models/Compra.js";
import { Op, fn, col, literal, where, Sequelize } from 'sequelize';
import db from "../data/db.js";
import { startOfYear, format, addMonths } from 'date-fns';

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

        const resultado = await Compra.findAll({
            include: [
                {
                    model: ItemCompra,
                    include: [
                        {
                            model: Ingresso,
                            include: [
                                {
                                    model: Event,
                                    include: [
                                        {
                                            model: Produtor,
                                            where: { usuario_id: usuario_id }, // ← Aqui está a checagem correta
                                            attributes: [],
                                            required: true,
                                        },
                                    ],
                                    attributes: [],
                                    required: true,
                                },
                            ],
                            attributes: [],
                            required: true,
                        },
                    ],
                    attributes: [],
                    required: true,
                },
            ],
            where: {
                status: 'Aprovada',
            },
            attributes: [
                [fn('SUM', col('valor_total')), 'total_arrecadado'],
            ],
            raw: true,
        });

        const totalArrecadado = resultado[0]?.total_arrecadado || 0;

        return res.status(200).json({ totalArrecadado });

    } catch (error) {
        console.error("Erro ao calcular total arrecadado =>", error);
        return res.status(500).json({ msg: "Erro ao calcular total arrecadado", error });
    }
}

export async function getTotalArrecadadoPorEvento(req, res) {
    try {
        const { usuario_id } = req.params;

        const resultados = await Compra.findAll({
            include: [
                {
                    model: ItemCompra,
                    include: [
                        {
                            model: Ingresso,
                            include: [
                                {
                                    model: Event,
                                    include: [
                                        {
                                            model: Produtor,
                                            where: { usuario_id }, // Filtro pelo usuário
                                            attributes: [],
                                            required: true
                                        }
                                    ],
                                    attributes: ['evento_id', 'name'], // Retorna o evento_id e nome do evento
                                    required: true,
                                }
                            ],
                            attributes: [],
                            required: true,
                        }
                    ],
                    attributes: [],
                    required: true,
                }
            ],
            where: {
                status: 'Aprovada', // Considera apenas as compras aprovadas
            },
            attributes: [
                [col('ItemCompras.Ingresso.Event.evento_id'), 'evento_id'], // Alias correto para evento_id
                [col('ItemCompras.Ingresso.Event.name'), 'nome_evento'], // Alias correto para nome_evento
                [fn('SUM', col('ItemCompras.valor_total')), 'total_arrecadado'], // Soma do valor_total do ItemCompra
            ],
            group: ['ItemCompras.Ingresso.Event.evento_id', 'ItemCompras.Ingresso.Event.name'], // Agrupa por evento_id e nome
            raw: true,
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
        const resultados = await Compra.findAll({
            include: [
                {
                    model: ItemCompra,
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
                        }
                    ],
                    attributes: [],
                    required: true
                }
            ],
            where: {
                status: 'Aprovada',
                data_compra: {
                    [Op.gte]: new Date(`${anoAtual}-01-01`), // A partir de janeiro do ano atual
                    [Op.lt]: new Date(anoAtual, mesAtual + 1, 0).setHours(23, 59, 59, 999), // Até o final do mês atual
                }
            },
            attributes: [
                [fn('SUM', col('valor_total')), 'total_arrecadado'],
                [fn('TO_CHAR', col('data_compra'), 'YYYY-MM'), 'mes'], // Formato 'YYYY-MM'
            ],
            group: [literal(`TO_CHAR("Compra"."data_compra", 'YYYY-MM')`)],
            order: [literal('mes ASC')],
            raw: true
        });

        // Criar um array com todos os meses do ano até o mês atual
        const mesesDoAno = [];
        for (let i = 0; i <= mesAtual; i++) { // Até o mês atual
            const mes = new Date(anoAtual, i, 1); // Cria um objeto de data para o primeiro dia de cada mês
            mesesDoAno.push({
                mes: mes.toISOString().split('T')[0].slice(0, 7), // Formato 'YYYY-MM'
                total_arrecadado: 0 // Valor inicial 0
            });
        }

        // Preencher os dados de arrecadação nos meses correspondentes
        resultados.forEach(result => {
            // Extrair o mês no formato 'YYYY-MM'
            const mes = result.mes;
            const index = mesesDoAno.findIndex(m => m.mes === mes);
            if (index !== -1) {
                mesesDoAno[index].total_arrecadado = parseFloat(result.total_arrecadado) || 0;
            }
        });

        return res.status(200).json(mesesDoAno);
    } catch (error) {
        console.error("Erro ao calcular arrecadação mensal =>", error);
        return res.status(500).json({ msg: "Erro ao calcular arrecadação mensal", error });
    }
}

// PROXIMOS EVENTOS - FILTRADO PELO PRODUTOR
export async function proximosEventos(req,res){
        const {usuario_id} = req.params 

        try {
            const produtor = await Produtor.find({where: {usuario_id: usuario_id}})
            if(!produtor){
                return res.status(400).json({msg: "Produtor não encontrado!"})
            }
            
            const eventos = await Event.findAll({where: {produtor_id: produtor.produtor_id, status: "Disponível"}}) 
    
            if(eventos.lenght === 0){
                return res.status(400).json({msg: "Nenhum evento cadastrado desse produtor"})
            }
    
            return res.status(200).json(eventos)   
        } catch (error) {
            return res.status(400).json({msg: "Erro na rota de filtrar proximos eventos => ", error})
        }
}


// RECEITA POR MES
export async function receitaPorMes(req,res){

    try {
        const {usuario_id} = req.params 


        const produtor = await Produtor.findOne({where: {usuario_id}})
        if(!produtor){
            return res.status(400).json({msg: "Produtor não encontrado!"})
        }
        
        const result = await db.query(`WITH meses_do_ano AS (
      SELECT TO_CHAR(DATE_TRUNC('year', CURRENT_DATE) + (interval '1 month' * i), 'MM') AS mes
      FROM generate_series(0, 11) AS i
    )
    SELECT 
      m.mes,
      COALESCE(SUM(c."valor_total"), 0) AS receita_total
    FROM 
      meses_do_ano m
    LEFT JOIN "Compras" c ON TO_CHAR(c."createdAt", 'MM') = m.mes
    LEFT JOIN "ItemCompras" ic ON ic."compra_id" = c."compra_id"
    LEFT JOIN "Ingressos" i ON i."ingresso_id" = ic."ingresso_id"
    LEFT JOIN "events" e ON e."evento_id" = i."evento_id" AND e."status" = 'Disponível'
    LEFT JOIN "produtores" p ON p."produtor_id" = e."produtor_id" AND p."usuario_id" = ${produtor.produtor_id}
    GROUP BY 
      m.mes
    ORDER BY 
      m.mes;
    
    `, {
        type: db.QueryTypes.SELECT
    })
    
      return res.status(200).json(result);
    } catch (error) {
        return res.status(501).json({msg: "Erro na rota de relatório receita mensal => ", error})
    }
}