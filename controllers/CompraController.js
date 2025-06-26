import Compra from "../models/Compra.js";
import User from '../models/user.js'
import Ingresso from '../models/Ingresso.js'
import House from '../models/Local.js'
import Evento from '../models/event.js'
import ItemCompra from "../models/ItemCompra.js";
import { Op } from "sequelize";
import QRCode from 'qrcode'
import jwt from "jsonwebtoken";
import db from "../data/db.js";
const SECRET = process.env.SECRET_TICKET

Evento.belongsTo(House, { foreignKey: 'house_id' });
House.hasMany(Evento, { foreignKey: 'house_id' });
// Compra e ItemCompra
Compra.hasMany(ItemCompra, { foreignKey: 'compra_id' });
ItemCompra.belongsTo(Compra, { foreignKey: 'compra_id' });

// ItemCompra e Ingresso
ItemCompra.belongsTo(Ingresso, { foreignKey: 'ingresso_id' });
Ingresso.hasMany(ItemCompra, { foreignKey: 'ingresso_id' });

// Ingresso e Evento
Ingresso.belongsTo(Evento, { foreignKey: 'evento_id' });
Evento.hasMany(Ingresso, { foreignKey: 'evento_id' });

// CRIAR A COMPRA
export async function criarCompra(req, res) {
    try {
        const { usuario_id, itens } = req.body;
        const itensCompra = [];

        // Verifica se o usuário existe
        const user = await User.findByPk(usuario_id);
        if (!user) {
            return res.status(400).json({ msg: "Usuário não encontrado!" });
        }

        // Cria a compra inicial (valor e status serão atualizados depois)
        const compra = await Compra.create({
            usuario_id,
            valor_total: 0,
        });

        let valorTotal = 0;

        for (let item of itens) {
            const ingresso = await Ingresso.findByPk(item.ingresso_id);
            if (!ingresso) {
                return res.status(400).json({ msg: "Ingresso não encontrado!" });
            }

            if (ingresso.quantidade_maxima_por_compra < item.quantidade) {
                return res.status(400).json({ msg: "Quantidade máxima por compra não permitida!" });
            }

            if (ingresso.quantidade_total <= ingresso.quantidade_vendida) {
                return res.status(409).json({ msg: "Ingresso esgotado!" });
            }

            if (item.quantidade > (ingresso.quantidade_total - ingresso.quantidade_vendida)) {
                return res.status(409).json({ msg: "Quantidade de ingressos indisponível!" });
            }

            // Gera token e QR Code
            const payLoad = {
                compra_id: compra.compra_id,
                ingresso_id: item.ingresso_id,
            };
            const token = jwt.sign(payLoad, SECRET);
            const qrCode = await QRCode.toDataURL(token);

            // Cria item da compra
            const itemCompra = await ItemCompra.create({
                compra_id: compra.compra_id,
                ingresso_id: item.ingresso_id,
                quantidade: item.quantidade,
                valor_unitario: ingresso.valor,
                qr_code: qrCode,
            });

            itensCompra.push(itemCompra);

            // Atualiza o valor total
            valorTotal += ingresso.valor * item.quantidade;

            // Atualiza quantidade vendida
            ingresso.quantidade_vendida += item.quantidade;
            await ingresso.save();
        }

        // Atualiza o valor total na compra
        compra.valor_total = valorTotal;

        if (valorTotal === 0) {
            // Compra gratuita — não passa pela Pagar.me
            compra.status = 'Aprovada'; // ✅ status válido
        } else {
            // Compra com valor — segue para pagamento
            compra.status = 'Aguardando Pagamento';

            // Aqui você pode chamar a função que integra com a Pagar.me
            // Exemplo fictício:
            // await iniciarPagamentoPagarme(compra, user, itensCompra);
        }

        await compra.save();

        res.status(200).json({ compra, itensCompra });

    } catch (error) {
        console.log("Erro na rota de criar uma compra => ", error);
        return res.status(500).json({ msg: "Erro na rota de criar uma compra => ", error });
    }
}

export async function validarIngresso(req, res) {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ msg: "Token não fornecido." });
        }

        // Verificar token
        let verifyToken;
        try {
            verifyToken = jwt.verify(token, SECRET);
        } catch (error) {
            return res.status(403).json({ msg: "Token inválido ou expirado." });
        }

        // Verificar se os dados do ingresso existem no token
        const { ingresso_id, compra_id} = verifyToken;
        if (!ingresso_id || !compra_id) {
            return res.status(400).json({ msg: "Token inválido, dados do ingresso ausentes." });
        }

        // Buscar o ingresso no banco de dados
        const itemCompra = await ItemCompra.findOne({
            where: { ingresso_id, compra_id}
        });

        if (!itemCompra) {
            return res.status(400).json({ msg: "Código de ingresso inválido." });
        }

        if (itemCompra.usado) {
            return res.status(400).json({ msg: "Ingresso já foi utilizado." });
        }

        // Atualizar o status do ingresso para usado
        itemCompra.usado = true;
        await itemCompra.save();

        return res.status(200).json({ msg: "Ingresso autenticado.", itemCompra });
    } catch (error) {
        console.error("Erro na rota de validar ingresso => ", error);
        return res.status(500).json({ msg: "Erro interno no servidor.", error });
    }
}

// LISTA INGRESSOS
export async function listarIngressosComprados(req, res) {
    try {
        const { usuario_id } = req.query;

        if (!usuario_id) {
            return res.status(400).json({ error: 'usuario_id é obrigatório' });
        }

        const userId = parseInt(usuario_id, 10); // Garante que é número

        const ingressos = await db.query(`
            SELECT 
                c.compra_id,
                c.data_compra,
                c.valor_total,
                c.status,
                c.transaction_id,
                c."createdAt" AS compra_created_at,
                c."updatedAt" AS compra_updated_at,
                c.usuario_id,

                ic."itemCompra_id",
                ic.quantidade,
                ic.valor_unitario,
                ic.qr_code,
                ic.usado,
                ic."createdAt" AS item_compra_created_at,
                ic."updatedAt" AS item_compra_updated_at,

                i.ingresso_id,
                i.titulo AS titulo_ingresso,
                i.valor,
                i.meia_entrada,
                i.descricao,

                e.name AS nome_evento,
                e.evento_id,
                e."photos",
                e."dateStart",
                e."startTime",

                l.name AS nome_local,
                l.address,
                l.city,
                l.state

            FROM public."Compras" c
            JOIN public."ItemCompras" ic ON ic.compra_id = c.compra_id
            JOIN public."Ingressos" i ON i.ingresso_id = ic.ingresso_id
            JOIN public.events e ON e.evento_id = i.evento_id
            JOIN public."Local" l ON l.house_id = e.house_id
            WHERE c.usuario_id = :usuario_id
            ORDER BY c.data_compra DESC;
        `, {
            replacements: { usuario_id: userId },
            type: db.Sequelize.QueryTypes.SELECT
        });

        if (!ingressos || ingressos.length === 0) {
            return res.status(404).json({ msg: `Nenhum ingresso encontrado` });
        }

        return res.status(200).json(ingressos);

    } catch (error) {
        console.error('Erro ao listar ingressos:', error);
        return res.status(500).json({ error: 'Erro ao buscar ingressos comprados', detalhes: error.message });
    }
}

export async function cancelarCompra(req,res) {
    try {
        const {usuario_id, compra_id} = req.body
        // Busca a compra
        const compra = await Compra.findByPk(compra_id);
        if(!compra){
            return res.status(400).json({msg: "Id de compra inválido"})
        }
        if(compra.status === 'Cancelada'){
            return res.status(400).json({msg: "Esta compra ja está cancelada!"})
        }

        if(compra.usuario_id !== usuario_id){
            return res.status(403).json({msg: "Você nao tem permissão para cancelar essa compra!"})
        }

        const itemCompra = await ItemCompra.findAll({where: {compra_id: compra_id}})
        if(itemCompra.length === 0){
            return res.status(400).json({msg: "Item Compra não encontrado"})
        }

        // voltando com as quantidades disponíveis
        for(let item of itemCompra){
            const ingresso = await Ingresso.findByPk(item.ingresso_id)
            if (!ingresso) {
                return res.status(400).json({ msg: "Ingresso não encontrado!" });
            }

            if(item.usado){
                return res.status(400).json({msg: "Ingresso já foi usado.", item})
            }

            ingresso.quantidade_vendida -= item.quantidade
            await ingresso.save();
        }


        // Atualiza o status da compra para "Cancelada"
        const [updated] = await Compra.update(
            { status: 'Cancelada' },
            { where: { compra_id } }
        );

        if (!updated) {
            return res.status(400).json({ msg: "Falha ao cancelar a compra!" });
        }

        // Retorna a compra atualizada
        const compraAtualizada = await Compra.findByPk(compra_id);
        return res.status(200).json({ msg: "Compra cancelada com sucesso!", compra: compraAtualizada });
    } catch (error) {
        console.log("Erro na rota de cancelar compras => ", error)
        return res.status(500).json({ msg: "Erro na rota de cancelar compras => ", error })
    }
}


export async function listarComprasPorData(req,res){

    try {
        const {dataInicio, dataFim} = req.body

        if(!dataInicio){
            return res.status(400).json({msg: "Informe a data inicial"})
        }
        if(!dataFim){
            return res.status(400).json({msg: "Informe a data final"})
        }

        const dataInicialFormat = new Date(dataInicio)
        const dataFimFormat = new Date(dataFim)

        const compras = await Compra.findAll({
            where: {
                data_compra: {
                    [Op.between]: [dataInicialFormat, dataFimFormat]
                }
            }

        })

        if(compras.length === 0){
            return res.status(400).json({msg: "Nenhuma compra encontrada!"})
        }

        return res.status(200).json(compras)
    } catch (error) {
        console.log("Erro na rota de listar compras por datas => ", error)
        return res.status(500).json({ msg: "Erro na rota de listar compras por datas => ", error })
    }
}