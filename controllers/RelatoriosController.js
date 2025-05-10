import Event from "../models/event.js";
import Ingresso from "../models/Ingresso.js";
import Produtor from "../models/Produtor.js";
import ItemCompra from "../models/ItemCompra.js";
import Compra from "../models/Compra.js";
import { Op, fn, col, literal, where, Sequelize } from 'sequelize';
import db from "../data/db.js";
import { startOfYear, format, addMonths } from 'date-fns';
import Producer from "../models/Produtor.js";
import Usuario from "../models/user.js";
import Local from "../models/Local.js";

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

export async function listEventos(req, res) {
    try {
        const { usuario_id } = req.params;

        // Obter a data atual
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const totalEventos = await Event.count({
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
        });

        return res.status(200).json({ totalEventos });

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

// RECEITA POR EVENTO
export async function receitaPorEvento(req, res) {
    try {
        const { usuario_id } = req.params;

        // Verificando se o produtor existe
        const produtor = await Produtor.findOne({ where: { usuario_id } });
        if (!produtor) {
            return res.status(400).json({ msg: "Produtor não encontrado!" });
        }

        // Executando a query com a modificação no LEFT JOIN para considerar o usuario_id
        const result = await db.query(`
            SELECT
                e."evento_id",
                e."name" AS nome_evento,
                COALESCE(SUM(c."valor_total"), 0) AS receita_total
            FROM
                "events" e
            LEFT JOIN "produtores" p ON p."produtor_id" = e."produtor_id"
                                     AND p."usuario_id" = :usuarioId
            LEFT JOIN "Ingressos" i ON i."evento_id" = e."evento_id"
            LEFT JOIN "ItemCompras" ic ON ic."ingresso_id" = i."ingresso_id"
            LEFT JOIN "Compras" c ON c."compra_id" = ic."compra_id"
            WHERE
                c."status" = 'Aprovada'
            GROUP BY
                e."evento_id", e."name"
            ORDER BY
                receita_total DESC;
        `, {
            replacements: { usuarioId: usuario_id },  // Substituindo pelo usuario_id da requisição
            type: db.QueryTypes.SELECT
        });

        return res.status(200).json(result);
    } catch (error) {
        return res.status(501).json({ msg: "Erro na rota de receita por evento", error });
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

// PROXIMOS EVENTOS
export async function proximosEventos(req, res) {
    try {
        const { usuario_id } = req.params;

        // Garantir que o usuário esteja tratando o id corretamente
        const userId = parseInt(usuario_id, 10); // Convertendo para número (ou outra forma conforme o tipo do campo)

        const events = await db.query(`
            SELECT 
                e."name" AS nome_evento,
                e."photos"::text,  -- Convertendo o campo JSON para texto
                e."dateStart",
                e."startTime",
                COALESCE(SUM(i."quantidade_vendida"), 0) AS ingressos_vendidos,
                COALESCE(SUM(i."quantidade_total"), 0) AS ingressos_totais,
                COALESCE(ROUND(
                    (SUM(i."quantidade_vendida")::numeric / NULLIF(SUM(i."quantidade_total"), 0)) * 100, 2
                ), 0) AS porcentagem_vendida
            FROM 
                public."events" e
            JOIN 
                public."produtores" p ON p."produtor_id" = e."produtor_id"
            LEFT JOIN 
                public."Ingressos" i ON i."evento_id" = e."evento_id"
            WHERE 
                p."usuario_id" = :usuario_id
                AND e."dateStart" >= NOW()
            GROUP BY 
                e."evento_id", e."name", e."photos"::text, e."dateStart", e."startTime"
            ORDER BY 
                e."dateStart" DESC;
        `, {
            replacements: { usuario_id: userId }, // Passando o valor convertido
            type: db.QueryTypes.SELECT
        });

        if (!events || events.length === 0) {
            return res.status(404).json({ msg: `Nenhum evento futuro encontrado para o usuário ${usuario_id}` });
        }

        return res.status(200).json(events);
    } catch (error) {
        console.error("Erro ao buscar eventos futuros pelo usuário =>", error);
        return res.status(500).json({ msg: "Erro interno ao buscar eventos futuros", error });
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

//Participantes por evento
export async function participantesPorEvento(req, res) {
    try {
        const { usuario_id } = req.params;

        const produtor = await Produtor.findOne({ where: { usuario_id } });
        if (!produtor) {
            return res.status(400).json({ msg: "Produtor não encontrado!" });
        }

        const result = await db.query(`
      SELECT 
        e.evento_id,
        e.name AS nome_evento,
        e."dateStart",
        COALESCE(SUM(i.quantidade_vendida), 0) AS total_participantes
      FROM 
        public.events e
      JOIN 
        public.produtores p ON e.produtor_id = p.produtor_id
      LEFT JOIN 
        public."Ingressos" i ON e.evento_id = i.evento_id
      WHERE 
        p.usuario_id = :usuarioId
      GROUP BY 
        e.evento_id, e.name, e."dateStart"
      ORDER BY 
        e."dateStart" DESC;
    `, {
            replacements: { usuarioId: usuario_id },
            type: db.QueryTypes.SELECT
        });

        return res.status(200).json(result);
    } catch (error) {
        return res.status(501).json({
            msg: "Erro na rota de participantes por evento =>",
            error
        });
    }
}

// Participantes por mês (baseado na data do evento)
export async function participantesPorMes(req, res) {
    try {
        const { usuario_id, id_evento } = req.params;

        const produtor = await Produtor.findOne({ where: { usuario_id } });
        if (!produtor) {
            return res.status(400).json({ msg: "Produtor não encontrado!" });
        }

        const eventoCondition = id_evento ? `AND e.evento_id = :id_evento` : ''; // Condição para evento específico, se fornecido

        const result = await db.query(`
            WITH meses_do_ano AS (
                SELECT TO_CHAR(DATE_TRUNC('year', CURRENT_DATE) + (interval '1 month' * i), 'MM') AS mes,
                       TO_CHAR(DATE_TRUNC('year', CURRENT_DATE) + (interval '1 month' * i), 'Month') AS mes_nome
                FROM generate_series(0, 11) AS i
            )
            SELECT 
                m.mes,
                TRIM(m.mes_nome) AS nome_mes,
                COALESCE(SUM(i.quantidade_vendida), 0) AS total_participantes
            FROM 
                meses_do_ano m
            LEFT JOIN events e ON TO_CHAR(e."dateStart", 'MM') = m.mes
            LEFT JOIN "Ingressos" i ON i.evento_id = e.evento_id
            LEFT JOIN produtores p ON p.produtor_id = e.produtor_id AND p.usuario_id = :produtorId
            WHERE 1=1
            ${eventoCondition}  -- Adiciona a condição do evento se fornecido
            GROUP BY 
                m.mes, m.mes_nome
            ORDER BY 
                m.mes;
        `, {
            replacements: {
                produtorId: produtor.produtor_id,
                id_evento: id_evento
            },
            type: db.QueryTypes.SELECT
        });

        return res.status(200).json(result);
    } catch (error) {
        return res.status(501).json({
            msg: "Erro na rota de participantes por mês =>",
            error
        });
    }
}
