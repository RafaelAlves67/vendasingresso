import Ticket from "../models/ticket.js"
import TicketLot from "../models/ticketLot.js"
import Event from "../models/event.js"

export async function buyTicket(req,res){
    try {
        
    } catch (error) {
        console.log("erro na rota de registro de ingresso")
    }
    const {event_id, lote_id} = req.body 


    if(!event_id){
        return res.status(400).json({msg: "Insira qual evento deseja comprar"})
    }

    const event = await Event.findByPk(event_id)
    if(!event){
        return res.status(400).json({msg: "Id de evento não encontrado!"})
    }
}