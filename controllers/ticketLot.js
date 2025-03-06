import showHouse from "../models/showHouse.js"
import eventRoute from "../routes/eventRoute.js"
import TicketLot from "../models/ticketLot.js"
import ticket from '../models/ticket.js'

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
            return res.status(400).json({msg: "Insira a data inicial do lote!"})
        }

        // validação do evento
        const event = await Event.findByPk(event_id)
        if(!event){
            return res.status(400).json({msg: "Id de evento não encontrado"})
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
        });
          
        const capacidadeMaxima = await Event.findOne({
            where: { id: event_id },
            include: [{ model: showHouse, as: "casaShow" }]
        });

        if (!capacidadeMaxima || !capacidadeMaxima.casaShow || capacidadeMaxima.casaShow.capacity === undefined) {
            return res.status(400).json({ msg: "Erro ao buscar capacidade da casa de show." });
        }
          
        if (totalIngressos + max_quantity > capacidadeMaxima.capacity) {
            return res.status(409).json({msg: "O total de ingressos excede a capacidade da casa de show."});
        } 

        // validação data do lote 
        const eventDate = new Date(event.date);
        // Comparação entre as datas do lote e do evento
        if (new Date(start_date) < eventDate || new Date(end_date) < eventDate) {
        return res.status(400).json({ msg: "O lote deve começar e terminar após a data do evento!" });
        }

// Validar se o final do lote é antes do início
if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({ msg: "A data de término do lote não pode ser antes da data de início!" });
}

        // se existir lote nessa mesma data e evento
        // Validação de horário e conflito de eventos
        const ticketLoteVerifyDate = await TicketLot.findOne({
            where: {
                event_id: event_id,
                [Op.or]: [
                    { start_date: { [Op.between]: [start_date, end_date] } },
                    { end_date: { [Op.between]: [start_date, end_date] } },
                    {
                        start_date: { [Op.lte]: start_date },
                        end_date: { [Op.gte]: end_date }
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

        return res.status(200).json({msg: `Lote cadastrado no evento ${event.name}`, newLote})
    
           
    } catch (error) {
        console.log("Erro na rota de cadastro de lote => " , error)
        return res.status(500).json({msg: "Erro na rota de cadastro de lote => " + error})
    }   
}