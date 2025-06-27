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
        const { usuario_id, id_evento } = req.params;

        // Converte o id_evento, ignorando se for "null", "undefined" ou vazio
        const eventoIdValido = id_evento && id_evento !== "null" && id_evento !== "undefined" && id_evento !== ""
            ? Number(id_evento)
            : null;

        const totalIngressosVendidos = await Event.findAll({
            where: {
                // Aplica o filtro de evento_id apenas se for válido
                ...(eventoIdValido && { evento_id: eventoIdValido }),
                produtor_id: {
                    [Op.not]: null,
                },
            },
            include: [
                {
                    model: Produtor,
                    as: 'produtor',
                    where: { usuario_id },
                    attributes: [],
                },
                {
                    model: Ingresso,
                    as: 'ingressos',
                    attributes: [],
                },
            ],
            attributes: [
                [fn('SUM', fn('COALESCE', col('ingressos.quantidade_vendida'), 0)), 'total_ingressos_vendidos'],
            ],
            raw: true,
        });

        const total = totalIngressosVendidos[0]?.total_ingressos_vendidos || 0;

        return res.status(200).json({ total_ingressos_vendidos: total });

    } catch (error) {
        console.log("Erro na rota de total de ingressos vendidos =>", error);
        return res.status(500).json({ msg: "Erro na rota de total de ingressos vendidos", error });
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
        const { usuario_id, id_evento } = req.params;

        const eventoIdValido =
            id_evento && id_evento !== "null" && id_evento !== "undefined" && id_evento !== ""
                ? Number(id_evento)
                : null;

        const compras = await Compra.findAll({
            include: [
                {
                    model: ItemCompra,
                    include: [
                        {
                            model: Ingresso,
                            include: [
                                {
                                    model: Event,
                                    where: {
                                        ...(eventoIdValido && { evento_id: eventoIdValido }),
                                    },
                                    include: [
                                        {
                                            model: Produtor,
                                            where: { usuario_id },
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
            attributes: [['compra_id', 'id'], 'valor_total'],
            raw: true,
        });

        // Filtrar compras únicas por compra_id
        const comprasUnicasMap = new Map();
        for (const compra of compras) {
            if (!comprasUnicasMap.has(compra.id)) {
                comprasUnicasMap.set(compra.id, compra);
            }
        }

        const totalArrecadado = Array.from(comprasUnicasMap.values())
            .reduce((acc, compra) => acc + Number(compra.valor_total), 0);

        return res.status(200).json({ totalArrecadado });

    } catch (error) {
        console.error("Erro ao calcular total arrecadado =>", error);
        return res.status(500).json({
            msg: "Erro ao calcular total arrecadado",
            error,
        });
    }
}

export async function receitaPorEvento(req, res) {
    try {
        const { usuario_id, id_evento } = req.params;

        const produtor = await Produtor.findOne({ where: { usuario_id } });
        if (!produtor) {
            return res.status(400).json({ msg: "Produtor não encontrado!" });
        }

        const eventoIdValido =
            id_evento && id_evento !== "null" && id_evento !== "undefined" && id_evento !== ""
                ? Number(id_evento)
                : null;

        const result = await db.query(
            `
      SELECT
        e."evento_id",
        e."name" AS nome_evento,
        COALESCE(SUM(c."valor_total"), 0) AS receita_total
      FROM
        "events" e
      INNER JOIN "produtores" p ON p."produtor_id" = e."produtor_id"
        AND p."usuario_id" = :usuarioId
      LEFT JOIN (
        SELECT
          c."compra_id",
          c."valor_total",
          i."evento_id"
        FROM "Compras" c
        INNER JOIN "ItemCompras" ic ON ic."compra_id" = c."compra_id"
        INNER JOIN "Ingressos" i ON i."ingresso_id" = ic."ingresso_id"
        WHERE c."status" = 'Aprovada'
        GROUP BY c."compra_id", c."valor_total", i."evento_id"
      ) c ON c."evento_id" = e."evento_id"
      WHERE
        (:idEvento IS NULL OR e."evento_id" = :idEvento)
      GROUP BY
        e."evento_id", e."name"
      ORDER BY
        receita_total DESC;
      `,
            {
                replacements: {
                    usuarioId: usuario_id,
                    idEvento: eventoIdValido,
                },
                type: db.QueryTypes.SELECT,
            }
        );

        return res.status(200).json(result);

    } catch (error) {
        console.error("Erro na rota de receita por evento =>", error);
        return res.status(501).json({ msg: "Erro na rota de receita por evento", error });
    }
}

export async function getPercentualVendaIngressosPorEvento(req, res) {
    try {
        const { usuario_id, id_evento } = req.params;

        const eventoIdValido = id_evento && id_evento !== "null" && id_evento !== "undefined" && id_evento !== ""
            ? Number(id_evento)
            : null;

        const eventoFilter = eventoIdValido ? { evento_id: eventoIdValido } : {};

        const resultados = await ItemCompra.findAll({
            include: [
                {
                    model: Ingresso,
                    include: [
                        {
                            model: Event,
                            where: {
                                ...eventoFilter
                            },
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
        const { usuario_id, id_evento } = req.params;

        const produtor = await Produtor.findOne({ where: { usuario_id } });
        if (!produtor) {
            return res.status(400).json({ msg: "Produtor não encontrado!" });
        }

        const eventoIdValido =
            id_evento && id_evento !== "null" && id_evento !== "undefined" && id_evento !== ""
                ? Number(id_evento)
                : null;

        const anoAtual = new Date().getFullYear();
        const mesAtual = new Date().getMonth();

        const dataInicio = `${anoAtual}-01-01`;
        const dataFim = new Date(anoAtual, mesAtual + 1, 0, 23, 59, 59, 999).toISOString();

        const result = await db.query(
            `
            SELECT
                TO_CHAR(sub.data_compra, 'YYYY-MM') AS mes,
                SUM(sub.valor_total) AS total_arrecadado
            FROM (
                SELECT DISTINCT ON (c."compra_id")
                    c."compra_id",
                    c."valor_total",
                    c."data_compra"
                FROM "Compras" c
                INNER JOIN "ItemCompras" ic ON ic."compra_id" = c."compra_id"
                INNER JOIN "Ingressos" i ON i."ingresso_id" = ic."ingresso_id"
                INNER JOIN "events" e ON e."evento_id" = i."evento_id"
                INNER JOIN "produtores" p ON p."produtor_id" = e."produtor_id"
                WHERE c."status" = 'Aprovada'
                  AND p."usuario_id" = :usuarioId
                  AND c."data_compra" >= :dataInicio
                  AND c."data_compra" <= :dataFim
                  AND (:idEvento IS NULL OR e."evento_id" = :idEvento)
            ) sub
            GROUP BY TO_CHAR(sub.data_compra, 'YYYY-MM')
            ORDER BY mes ASC;
            `,
            {
                replacements: {
                    usuarioId: usuario_id,
                    idEvento: eventoIdValido,
                    dataInicio,
                    dataFim
                },
                type: db.QueryTypes.SELECT
            }
        );

        // Preencher os meses ausentes
        const mesesDoAno = [];
        for (let i = 0; i <= mesAtual; i++) {
            const mes = new Date(anoAtual, i, 1);
            mesesDoAno.push({
                mes: mes.toISOString().split('T')[0].slice(0, 7),
                total_arrecadado: 0
            });
        }

        result.forEach((item) => {
            const index = mesesDoAno.findIndex(m => m.mes === item.mes);
            if (index !== -1) {
                mesesDoAno[index].total_arrecadado = parseFloat(item.total_arrecadado) || 0;
            }
        });

        return res.status(200).json(mesesDoAno);
    } catch (error) {
        console.error("Erro na rota de arrecadação mensal =>", error);
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
export async function receitaPorMes(req, res) {
    try {
        const { usuario_id, id_evento } = req.params;

        const produtor = await Produtor.findOne({ where: { usuario_id } });
        if (!produtor) {
            return res.status(400).json({ msg: "Produtor não encontrado!" });
        }

        const eventoIdValido = id_evento && id_evento !== "null" && id_evento !== "undefined" && id_evento !== ""
            ? Number(id_evento)
            : null;

        const eventoCondition = eventoIdValido ? `AND e."evento_id" = :id_evento` : '';

        const result = await db.query(`
            WITH meses_do_ano AS (
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
            LEFT JOIN "produtores" p ON p."produtor_id" = e."produtor_id" AND p."usuario_id" = :produtorId
            WHERE 1=1
            ${eventoCondition}
            GROUP BY 
                m.mes
            ORDER BY 
                m.mes;
        `, {
            replacements: {
                produtorId: produtor.produtor_id,
                id_evento: eventoIdValido
            },
            type: db.QueryTypes.SELECT
        });

        return res.status(200).json(result);
    } catch (error) {
        return res.status(501).json({
            msg: "Erro na rota de relatório receita mensal =>",
            error
        });
    }
}

//Participantes por evento
export async function participantesPorEvento(req, res) {
    try {
        const { usuario_id, id_evento } = req.params;

        const produtor = await Produtor.findOne({ where: { usuario_id } });
        if (!produtor) {
            return res.status(400).json({ msg: "Produtor não encontrado!" });
        }

        const eventoIdValido = id_evento && id_evento !== "null" && id_evento !== "undefined" && id_evento !== ""
            ? Number(id_evento)
            : null;

        const eventoCondition = eventoIdValido ? `AND e.evento_id = :id_evento` : '';

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
                ${eventoCondition}
            GROUP BY 
                e.evento_id, e.name, e."dateStart"
            ORDER BY 
                e."dateStart" DESC;
        `, {
            replacements: {
                usuarioId: usuario_id,
                id_evento: eventoIdValido
            },
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

        // Verifica se o produtor existe
        const produtor = await Produtor.findOne({ where: { usuario_id } });
        if (!produtor) {
            return res.status(400).json({ msg: "Produtor não encontrado!" });
        }

        // Valida o ID do evento (opcional)
        const eventoIdValido = id_evento && id_evento !== "null" && id_evento !== "undefined" && id_evento !== ""
            ? Number(id_evento)
            : null;

        // Monta a cláusula WHERE para filtrar por evento (se necessário)
        const eventoCondition = eventoIdValido ? `AND e.evento_id = :id_evento` : '';

        // Executa a query SQL
        const result = await db.query(`
            WITH meses_do_ano AS (
                SELECT
                    TO_CHAR(DATE_TRUNC('year', CURRENT_DATE) + (interval '1 month' * i), 'MM') AS mes,
                    TO_CHAR(DATE_TRUNC('year', CURRENT_DATE) + (interval '1 month' * i), 'Month') AS mes_nome
                FROM generate_series(0, 11) AS i
            )
            SELECT
                m.mes,
                TRIM(m.mes_nome) AS nome_mes,
                COALESCE(SUM(i.quantidade_vendida), 0) AS total_participantes
            FROM
                meses_do_ano m
                    LEFT JOIN events e
                              ON TO_CHAR(e."dateStart", 'MM') = m.mes
                                  AND EXTRACT(YEAR FROM e."dateStart") = EXTRACT(YEAR FROM CURRENT_DATE)
                                  AND e.produtor_id = :produtorId
                ${eventoCondition}
            LEFT JOIN "Ingressos" i ON i.evento_id = e.evento_id
            GROUP BY
                m.mes, m.mes_nome
            ORDER BY
                m.mes;
        `, {
            replacements: {
                produtorId: produtor.produtor_id,
                id_evento: eventoIdValido
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
