import showHouse from "../models/showHouse.js"
import eventRoute from "../routes/eventRoute.js"
import TicketLot from "../models/ticketLot.js"
import Ticket from '../models/ticket.js'

export async function registerLote(req,res){
    try {
        const {name, event_id, price, max_quantity, start_date, end_date} = req.body 

        // validações campos vazios
        if(!name){
            return res.status(400).json({msg: "Insira o nome do lote!"})
        }

        if(!price){
            return res.status(400).json({msg: "Insira o preço do lote!"})
        }

        if(!max_quantity){
            return res.status(400).json({msg: "Insira a quantidade máxima do lote!"})
        }

        if(!start_date){
            return res.status(400).json({msg: "Insira a data inicial do lote!"})
        }

        if(!end_date){
            return res.status(400).json({msg: "Insira a data final do lote!"})
        }

        if(!event_id){
            return res.status(400).json({ msg: "ID do evento é obrigatório!" });
        }
        

        // validação do evento
        const event = await Event.findByPk(event_id)
        if(!event){
            return res.status(400).json({msg: "Id de evento não encontrado"})
        }

        if(!event.ctrlLote){
            return res.status(400).json({msg: "O ingresso não controla lote"})
        }

        if(event.is_sold_out){
            return res.status(400).json({msg: "Evento esgotado!"})
        }

        if(event.status !== 'Disponível'){
            return res.status(400).json({msg: "Evento indisponível!"})
        }

        // validações de ingressos disponiveis  
        const totalIngressos = await TicketLot.sum("max_quantity", {
            where: { event_id }
        }) || 0;
          
     
        if (totalIngressos + max_quantity > event.qtde_ticket) {
            return res.status(409).json({msg: "O total de ingressos excede a capacidade do evento."});
        } 

        const priceNumber = parseFloat(price);
        if (isNaN(priceNumber)) {
            return res.status(400).json({ msg: "O preço do lote deve ser um número válido!" });
        }

        // validação data do lote 
        const eventDate = new Date(event.date);
        // Comparação entre as datas do lote e do evento
        if (new Date(start_date) > eventDate || new Date(end_date) > eventDate) {
        return res.status(400).json({ msg: "O lote deve começar e terminar antes da data do evento!" });
        }

// Validar se o final do lote é antes do início
if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({ msg: "A data de término do lote não pode ser antes da data de início!" });
}

        // se existir lote nessa mesma data e evento
        // Validação de horário e conflito de eventos
        const ticketLoteVerifyDate = await TicketLot.findOne({
            where: {
                event_id,
                [Op.or]: [
                    {
                        start_date: {
                            [Op.lte]: end_date
                        },
                        end_date: {
                            [Op.gte]: start_date
                        }
                    }
                ]
            }
        });

        if(ticketLoteVerifyDate){
            return res.status(409).json({msg: "Ja existe um Lote cadastrado nesse período de Data nesse evento!"})
        }

        const newLote = await TicketLot.create({
            name: name,
            event_id: event_id,
            price: price,
            max_quantity: max_quantity, 
            start_date: start_date, 
            end_date: end_date
        })

        const maxQty = parseInt(max_quantity);
        if (isNaN(maxQty)) {
            return res.status(400).json({ msg: "A quantidade máxima do lote deve ser um número válido!" });
        }

        // Gerar ingressos automaticamente para este lote
        let tickets = [];
        for (let i = 0; i < max_quantity; i++) {
            tickets.push({ event_id, lot_id: newLote.id, price, status: "Disponível" });
        }
        await Ticket.bulkCreate(tickets);

        return res.status(201).json({ msg: `Lote ${name} criado no evento ${event.name} e ingressos gerados!`, newLote });

       
    } catch (error) {
        console.log("Erro na rota de cadastro de lote => " , error)
        return res.status(500).json({msg: "Erro na rota de cadastro de lote => " + error})
    }   
}