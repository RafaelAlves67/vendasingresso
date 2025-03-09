import Compra from "../models/Compra.js";
import User from '../models/user.js'
import Ingresso from '../models/Ingresso.js'
import ItemCompra from "../models/ItemCompra.js";


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

            // checkar quantidades 
            if(item.quantidade > (ingresso.quantidade_total - ingresso.quantidade_vendida)){
                return res.status(409).json({msg: "Quantidade de ingressos indisponível"})
            }

            if(ingresso.quantidade_total < ingresso.quantidade_vendida){
                return res.status(409).json({msg: "Ingresso esgotado!"})
            }
        
        
        // Cria o item de compra, copiando o valor do ingresso para valor_unitario
       const itemCompra = await ItemCompra.create({
            compra_id: compra.compra_id,
            ingresso_id: item.ingresso_id,
            quantidade: item.quantidade,
            valor_unitario: ingresso.valor, // Copia o valor do ingresso
          }); 
          
          itensCompra.push(itemCompra)

          // atualizar valor total 
          valorTotal += ingresso.valor * item.quantidade 

          ingresso.quantidade_vendida += item.quantidade 
          await ingresso.save();
        }

        compra.valor_total = valorTotal
        await compra.save()

        res.status(200).json({compra, itensCompra});

    } catch (error) {
        console.log("Erro na rota de criar uma compra => ", error)
        return res.status(500).json({ msg: "Erro na rota de criar uma compra => ", error })
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