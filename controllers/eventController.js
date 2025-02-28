import Event from "../models/event.js"; 
import showHouse from "../models/showHouse.js";
import showHouse from "../models/showHouse.js";

export async function registerEvent(req,res){

    try {
        const {name, description, date, house_id, photos} = req.body 
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

        // validar se existe essa casa de show
        const houseVerify = await showHouse.findByPk(house_id)
        if(!houseVerify){
            return res.status(400).json({msg: "Casa de show não encontrada!"})
        }
    
        // validação de data
        const dateEvent = new Date(date)
        const dateNow = new Date()
        if(dateEvent < dateNow){
            res.status(400).json({msg: "Insira uma data válida para seu evento!"})
        }
        // validação de horario e dia na casa de show
        const eventByDataAndHouse = await Event.findOne({where: {
            date: dateEvent,
            house_id: house_id
        }})
        // chamando a casa de show
        const house = await showHouse.findByPk(house_id)

        if(eventByDataAndHouse){
            return res.status(409).json({msg: `Ja existe um evento marcado nesse dia ${date} na ${house.name}`})
        }
        // criando o evento
        const newEvent = await Event.create({
            name: name,
            description: description,
            date: date,
            house_id: house_id,
            photos: photos
        })

        return res.status(200).json({msg: "Evento cadastrado!", newEvent})
        
    } catch (error) {
        console.log("Erro com a rota de cadastro de evento => ", error)
        return res.status(500).json({msg: "Erro com a rota de cadastro de evento => ", error })
    }
}

export async function getSearchEvent(req,res){
    try {
        const name = req.params.name 

        const resultEvents = await Event.findAll({
            where: {
                name: {
                    [Op.like]: `%${name}%`
                }
            }
        })
    
        if(!resultEvents){
            return res.status(400).json({msg: "Nenhum evento encontrado."})
        }
    
        return res.status(200).json(resultEvents)   
    } catch (error) {
        console.log("Erro com a rota de pesquisa de eventos => " , error)
        return res.status(500).json({msg: "Erro com a rota de pesquisa de eventos => " , error})
    }
}

export async function getEventAll(req,res){
    try {
        const events = await Event.findAll()

        if(!events){
            return res.status(400).json({msg: "Nenhum evento encontrado"})
        }
        
        return res.status(200).json(events)
    } catch (error) {
        console.log("Erro com a rota de todos eventos => " , error)
        return res.status(500).json({msg: "Erro com a rota de todos eventos => " , error})
    }
}

export async function getEventsByHouse(req, res) {
    try {
        // id da casa de show
        const house_id = req.params.house_id
        // verificando a existencia dessa casa
        const house = await showHouse.findByPk(house_id)
        if (!house) {
            return res.status(400).json({ msg: "Casa de show não encontrada!" })
        }
        // buscando todos eventos dessa casa de show
        const eventsByHouse = await Event.findAll({ where: { house_id: house_id } })
        if (!eventsByHouse) {
            return res.status(400).json({ msg: `Nenhum evento encontrado na ${house.name}` })
        }
        // retornando valores
        return res.status(200).json(eventsByHouse)
    }
    catch (error) {
        console.log("Erro com a rota de evento por casa de show => " , error)
        return res.status(500).json({msg: "Erro com a rota de evento por casa de show => " , error})
    }
}

export async function deleteEvent(req,res){
    try {
        const id = req.params.id 

        const eventVerify = await Event.findByPk(id)
        if(!eventVerify){
            return res.status(400).json({msg: "Id de evento não encontrado!"})
        }
    
        await Event.destroy({where: {id: id}})
        return res.status(200).json({msg: "Evento excluído."})   
    } catch (error) {
        console.log("Erro com a rota de deletar evento => " , error)
        return res.status(500).json({msg: "Erro com a rota de deletar evento => " , error})
    }
}

export async function editEvent(req,res){
    
}