import Event from "../models/event.js"
import Ingresso from "../models/Ingresso.js"
import { Op } from "sequelize"

export async function registerTicket(req, res) {
    try {
        const { evento_id, tickets } = req.body

        if (!evento_id) {
            return res.status(400).json({ msg: "Informe o id do evento" })
        }

        const evento = await Event.findByPk(evento_id)
        if (!evento) {
            return res.status(400).json({ msg: "Id do evento inválido" })
        }

        // Extrair o house_id do evento
        const house_id = evento.house_id;

        // Verificação se o evento tem house_id
        if (!house_id) {
            return res.status(400).json({ msg: "Evento não possui um house_id associado" });
        }

        for (let ticket of tickets) {
            // VALIDAÇÕES
            if(!ticket.titulo){
                return res.status(400).json({msg: "Informe o título do ingresso"})
            }

            if(!ticket.quantidade_total){
                return res.status(400).json({msg: "Informe o a quantidade de ingresso"})
            }

            if(!ticket.valor){
                return res.status(400).json({msg: "Informe o valor do ingresso"})
            }

            if(!ticket.periodo_vendas_tipo){
                return res.status(400).json({msg: "Informe o tipo de período de vendas do ingresso"})
            }

            if(!ticket.data_inicio_vendas){
                return res.status(400).json({msg: "Informe a Data de Início das Vendas do ingresso"})
            }

            if(!ticket.hora_inicio_vendas){
                return res.status(400).json({msg: "Informe a hora de início das Vendas"})
            }

            if(!ticket.data_termino_vendas){
                return res.status(400).json({msg: "Informe a Data Término das Vendas"})
            }

            if(!ticket.hora_termino_vendas){
                return res.status(400).json({msg: "Informe a hora de témino das Vendas"})
            }

            if(!ticket.quantidade_minima_por_compra){
                return res.status(400).json({msg: "Informe o título do ingresso"})
            }

            if(!ticket.quantidade_maxima_por_compra){
                return res.status(400).json({msg: "Informe o título do ingresso"})
            }

              // Conversão dos valores da requisição
                const dateIngressoStart = new Date(ticket.data_inicio_vendas); // Converte a data para Date
                const dateIngressoEnd = new Date(ticket.data_termino_vendas); // Converte a data para Date
                const dateNow = new Date();

        // validação da data do evento
        if (dateIngressoStart.setHours(0, 0, 0, 0) < dateNow.setHours(0, 0, 0, 0 ) || dateIngressoEnd.setHours(0, 0, 0, 0) < dateNow.setHours(0, 0, 0, 0 )) {
            return res.status(400).json({ msg: "Insira uma data válida para seu ingresso!" });
        }

        if(dateIngressoEnd < dateIngressoStart){
            return res.status(400).json({ msg: "A data final não pode ser antes da data inicial!" });
        }

        }
        const novosIngressos = await Ingresso.bulkCreate(tickets)
        return res.status(200).json({ msg: "Ingressos cadastrado", novosIngressos })

    } catch (error) {
        console.log("Erro na rota de cadastro de ingresso => ", error)
        return res.status(501).json({ msg: "Erro na rota de cadastro de ingresso => ", error })
    }
}

export async function deleteTicket(req,res){
    try {
        const ingresso_id = req.params.id 

        // validação
        const ingressoVerify = await Ingresso.findByPk(ingresso_id)
        if(!ingressoVerify){
            return res.status(400).json({msg: "Id inválido"})
        }
        
        await Ingresso.destroy({where: {ingresso_id: ingresso_id}})
        return res.status(200).json({msg: "Ingresso excluido!"})   
    } catch (error) {
        console.log("Erro na rota de deletar ingresso => " , error)
        return res.status(500).json({msg: "Erro na rota de deletar ingresso => ", error})
    }
}

export async function editTicket(req,res){
    const { evento_id, ticket } = req.body

    if (!evento_id) {
        return res.status(400).json({ msg: "Informe o id do evento" })
    }

    const evento = await Event.findByPk(evento_id)
    if (!evento) {
        return res.status(400).json({ msg: "Id do evento inválido" })
    }
    // EXTRAIR INGRESSO
    const ingresso = await Ingresso.findByPk(ticket.id) 
    if(!ingresso){
        return res.status(400).json({msg: "Id do ingresso inválido"})
    }
    // Extrair o house_id do evento
    const house_id = evento.house_id;

    // Verificação se o evento tem house_id
    if (!house_id) {
        return res.status(400).json({ msg: "Evento não possui um house_id associado" });
    }

    

        // VALIDAÇÕES
        if(!ticket.titulo){
            return res.status(400).json({msg: "Informe o título do ingresso"})
        }

        if(!ticket.quantidade_total){
            return res.status(400).json({msg: "Informe o a quantidade de ingresso"})
        }

        if(!ticket.valor){
            return res.status(400).json({msg: "Informe o valor do ingresso"})
        }

        if(!ticket.periodo_vendas_tipo){
            return res.status(400).json({msg: "Informe o tipo de período de vendas do ingresso"})
        }

        if(!ticket.data_inicio_vendas){
            return res.status(400).json({msg: "Informe a Data de Início das Vendas do ingresso"})
        }

        if(!ticket.hora_inicio_vendas){
            return res.status(400).json({msg: "Informe a hora de início das Vendas"})
        }

        if(!ticket.data_termino_vendas){
            return res.status(400).json({msg: "Informe a Data Término das Vendas"})
        }

        if(!ticket.hora_termino_vendas){
            return res.status(400).json({msg: "Informe a hora de témino das Vendas"})
        }

        if(!ticket.quantidade_minima_por_compra){
            return res.status(400).json({msg: "Informe o título do ingresso"})
        }

        if(!ticket.quantidade_maxima_por_compra){
            return res.status(400).json({msg: "Informe o título do ingresso"})
        }

       

          // Conversão dos valores da requisição
            const dateIngressoStart = new Date(ticket.data_inicio_vendas); // Converte a data para Date
            const dateIngressoEnd = new Date(ticket.data_termino_vendas); // Converte a data para Date
            const dateNow = new Date();

    // validação da data do evento
    if (dateIngressoStart.setHours(0, 0, 0, 0) < dateNow.setHours(0, 0, 0, 0 ) || dateIngressoEnd.setHours(0, 0, 0, 0) < dateNow.setHours(0, 0, 0, 0 )) {
        return res.status(400).json({ msg: "Insira uma data válida para seu ingresso!" });
    }

    if(dateIngressoEnd < dateIngressoStart){
        return res.status(400).json({ msg: "A data final não pode ser antes da data inicial!" });
    } 

    const hasChanges = Object.keys(ticket).some(key => {
        const oldValue = ticket[key];  
        let newValue = ingresso[key];
         
        // Considerar remoção do campo como alteração
        return newValue !== undefined && String(oldValue) !== String(newValue);
    });

    if(hasChanges){
        return res.status(400).json({msg: "Não houve mudanças altere algo"})
    }

    await ingresso.update(ticket, {ingresso_id: ticket.id})
    return res.status(200).json({msg: "Ingresso alterado", ticket})
}