import Compra from "../models/Compra.js";
import User from '../models/user.js'
import Ingresso from '../models/Ingresso.js'
import ItemCompra from "../models/ItemCompra.js";
import { Op } from "sequelize";
import QRCode from 'qrcode'
import jwt from "jsonwebtoken";
const SECRET = process.env.SECRET_TICKET

// CRIAR A COMPRA
export async function criarCompra(req,res) {
    try {
        const {usuario_id, itens} = req.body 
        const itensCompra = []

        
        // Cria a compra
        const compra = await Compra.create({
            usuario_id,
            valor_total: 0, // Inicialmente zero, será atualizado
        });

        let valorTotal = 0

        // checkar se o usuario existe
        const user = await User.findByPk(usuario_id)
        if(!user){
            return res.status(400).json({msg: "Usuário não encontrado!"})
        }

        // checkar os itens
        for(let item of itens){
            // checkar se o ingresso existe
            const ingresso = await Ingresso.findByPk(item.ingresso_id)
            if(!ingresso){
                return res.status(400).json({msg: "Ingresso não encontrado!"})
            }

            // checkar se a quantidade maxima por compra está permitida
            if(ingresso.quantidade_maxima_por_compra < item.quantidade){
                return res.status(400).json({msg: "Quantidade maxima por compra não permitida!"})
            }
            // checkar se evento ja está esgotado
            if(ingresso.quantidade_total < ingresso.quantidade_vendida){
                return res.status(409).json({msg: "Ingresso esgotado!"})
            }

            // checkar quantidades 
            if(item.quantidade > (ingresso.quantidade_total - ingresso.quantidade_vendida)){
                return res.status(409).json({msg: "Quantidade de ingressos indisponível!"})
            }
            
            // GERAR TOKEN E QRCODE
            const payLoad = {
                compra_id: compra.compra_id,
                ingresso_id: item.ingresso_id
            }
            const token = jwt.sign(payLoad, SECRET)
            const qrCode = await QRCode.toDataURL(token)
        
        // Cria o item de compra, copiando o valor do ingresso para valor_unitario
       const itemCompra = await ItemCompra.create({
            compra_id: compra.compra_id,
            ingresso_id: item.ingresso_id,
            quantidade: item.quantidade,
            valor_unitario: ingresso.valor,
            qr_code: qrCode // TOKEN JWT
          }); 
          
          itensCompra.push(itemCompra)

          // atualizar valor total 
          valorTotal += ingresso.valor * item.quantidade 

          ingresso.quantidade_vendida += item.quantidade 
          await ingresso.save();
        }
        
        compra.valor_total = valorTotal

        // atualizando para aguardar pagamento
        compra.status = 'Aguardando Pagamento'
        await compra.save()

        res.status(200).json({compra, itensCompra});

    } catch (error) {
        console.log("Erro na rota de criar uma compra => ", error)
        return res.status(500).json({ msg: "Erro na rota de criar uma compra => ", error })
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
export async function listarIngressosComprados(req,res){
    try {
        const {usuario_id} = req.body 

        const Usuario = await User.findByPk(usuario_id)
        if(!Usuario){
            return res.status(400).json({msg: "Usuário não encontrado!"})
        }
    
         // Busca todas as compras do usuário
         const compras = await Compra.findAll({
            where: { usuario_id },
            include: [
                {
                    model: ItemCompra,
                    include: [
                        {
                            model: Ingresso, // Inclui os detalhes do ingresso
                        },
                    ],
                },
            ],
        });
    
        return res.status(200).json(compras)
    } catch (error) {
        console.log("Erro na rota de listar compras por usuario => ", error)
        return res.status(500).json({ msg: "Erro na rota de listar compras por usuario => ", error })
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