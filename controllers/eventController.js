import Event from "../models/event.js"; 
import showHouse from "../models/showHouse.js";

export async function registerEvent(req,res){

    try {
        const {name, description, date, house_id, ticket_price, ticket_lots, max_tickets_per_person} = req.body 
        // validações 
        if(!name){
            return res.status(400).json({msg: "Insira o nome do evento!"})
        }
    
        if(!description){
            return res.status(400).json({msg: "Insira a descrição do evento!"})
        }
    
        if(!date){
            return res.status(400).json({msg: "Insira a data do evento!"})
        }
    
        if(!house_id){
            return res.status(400).json({msg: "Insira a casa de show do evento!"})
        }
    
        if(!ticket_price){
            return res.status(400).json({msg: "Insira o preço do evento!"})
        }
        
        // validação de data
        const dateEvent = new Date(date)
        const dateNow = new Date()
        if(dateEvent < dateNow){
            res.status(400).json({msg: "Insira uma data válida para seu evento!"})
        }

        
    } catch (error) {
        console.log("Erro com a rota de cadastro de evento => ", error)
        return res.status(500).json({msg: "Erro com a rota de cadastro de evento => ", error })
    }
}