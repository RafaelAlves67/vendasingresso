import Event from "../models/event.js";
import showHouse from "../models/showHouse.js";
import { Op } from "sequelize";
import Ticket from "../models/ticket.js";

export async function registerEvent(req, res) {

    try {
        const { name, description, startTime, endTime, date, house_id, photos, ctrlLote, qtde_ticket } = req.body
        // validações 
        if (!name) {
            return res.status(400).json({ msg: "Insira o nome do evento!" })
        }

        if (!description) {
            return res.status(400).json({ msg: "Insira a descrição do evento!" })
        }

        if (!house_id) {
            return res.status(400).json({ msg: "Insira a casa de show do evento!" })
        }

        if (!date) {
            return res.status(400).json({ msg: "Insira o dia do evento!" })
        }

        if (!startTime) {
            return res.status(400).json({ msg: "Insira o horario inicial do evento!" })
        }

        if (!endTime) {
            return res.status(400).json({ msg: "Insira o horario final do evento!" })
        }

        if(!qtde_ticket || qtde_ticket <= 0){
            return res.status(400).json({ msg: "Insira a quantidade de ingressos a ser vendida no evento!" })
        }

        // validar se existe essa casa de show
        const houseVerify = await showHouse.findByPk(house_id)
        if (!houseVerify) {
            return res.status(400).json({ msg: "Casa de show não encontrada!" })
        }

        // validar capacidade maxima da casa de show
        if(qtde_ticket > houseVerify.capacity){
            return res.status(403).json({msg: "Capacidade de casa de show não suporta o número de ingressos total."})
        }

        // Conversão dos valores da requisição
        const dateEvento = new Date(date); // Converte a data para Date
        const dateNow = new Date();

        // validação da data do evento
        if (dateEvento.setHours(0, 0, 0, 0) < dateNow.setHours(0, 0, 0, 0)) {
            return res.status(400).json({ msg: "Insira uma data válida para seu evento!" });
        }

        // Validação de horário e conflito de eventos
        const eventByDataAndHouse = await Event.findOne({
            where: {
                house_id: house_id,
                date: date,
                [Op.or]: [
                    { startTime: { [Op.between]: [startTime, endTime] } },
                    { endTime: { [Op.between]: [startTime, endTime] } },
                    {
                        startTime: { [Op.lte]: startTime },
                        endTime: { [Op.gte]: endTime }
                    }
                ]
            }
        });

        

        if (eventByDataAndHouse) {
            return res.status(409).json({ msg: `Ja existe um evento marcado nesse dia ${date} na casa ${houseVerify.name} nos horarios entre ${startTime}-${endTime}` })
        }

        // criando o evento
        const newEvent = await Event.create({
            name: name,
            description: description,
            date: date,
            house_id: house_id,
            photos: photos,
            startTime: startTime,
            endTime: endTime,
            qtde_ticket: qtde_ticket
        })

        if(!ctrlLote){
            let tickets = [];
            for (let i = 0; i < qtde_ticket; i++) {
                tickets.push({ event_id: newEvent.id, status: "Disponível" });
            }
            await Ticket.bulkCreate(tickets);
        }

        return res.status(200).json({ msg: "Evento cadastrado!", newEvent })

    } catch (error) {
        console.log("Erro com a rota de cadastro de evento => ", error)
        return res.status(500).json.stringify(error)
    }
}

export async function getSearchEvent(req, res) {
    try {
        const name = req.params.name

        const resultEvents = await Event.findAll({
            where: {
                name: {
                    [Op.like]: `%${name}%`
                }
            }
        })

        if (!resultEvents) {
            return res.status(400).json({ msg: "Nenhum evento encontrado." })
        }

        return res.status(200).json(resultEvents)
    } catch (error) {
        console.log("Erro com a rota de pesquisa de eventos => ", error)
        return res.status(500).json({ msg: "Erro com a rota de pesquisa de eventos => ", error })
    }
}

export async function getEventAll(req, res) {
    try {
        const events = await Event.findAll()

        if (!events) {
            return res.status(400).json({ msg: "Nenhum evento encontrado" })
        }

        return res.status(200).json(events)
    } catch (error) {
        console.log("Erro com a rota de todos eventos => ", error)
        return res.status(500).json({ msg: "Erro com a rota de todos eventos => ", error })
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
        console.log("Erro com a rota de evento por casa de show => ", error)
        return res.status(500).json({ msg: "Erro com a rota de evento por casa de show => ", error })
    }
}

export async function deleteEvent(req, res) {
    try {
        const id = req.params.id

        const eventVerify = await Event.findByPk(id)
        if (!eventVerify) {
            return res.status(400).json({ msg: "Id de evento não encontrado!" })
        }

        await Event.destroy({ where: { id: id } })
        return res.status(200).json({ msg: "Evento excluído." })
    } catch (error) {
        console.log("Erro com a rota de deletar evento => ", error)
        return res.status(500).json({ msg: "Erro com a rota de deletar evento => ", error })
    }
}

export async function editEvent(req, res) {
    try {

        const { id, name, description, startTime, endTime, date, house_id, photos } = req.body
        const eventEdited = { name, description, startTime, endTime, date, house_id, photos }

        // validações 
        if (!name) {
            return res.status(400).json({ msg: "Insira o nome do evento!" })
        }

        if (!description) {
            return res.status(400).json({ msg: "Insira a descrição do evento!" })
        }

        if (!date) {
            return res.status(400).json({ msg: "Insira a data do evento!" })
        }

        if (!house_id) {
            return res.status(400).json({ msg: "Insira a casa de show do evento!" })
        }

        if (!date) {
            return res.status(400).json({ msg: "Insira o dia do evento!" })
        }

        if (!startTime) {
            return res.status(400).json({ msg: "Insira o horario inicial do evento!" })
        }

        if (!endTime) {
            return res.status(400).json({ msg: "Insira o horario final do evento!" })
        }

        // validar se existe essa casa de show
        const houseVerify = await showHouse.findByPk(house_id)
        if (!houseVerify) {
            return res.status(400).json({ msg: "Casa de show não encontrada!" })
        }

        const eventVerify = await Event.findByPk(id)
        if (!eventVerify) {
            return res.status(400).json({ msg: "Id de evento não encontrado!" })
        }

        const hasChanges = Object.keys(eventEdited).some(key => {
            const oldValue = eventVerify[key];
            let newValue = eventEdited[key];

            // Se for `photos`, converte JSON para comparar corretamente
            if (key === "photos" && typeof oldValue === "string") {
                try {
                    newValue = JSON.stringify(newValue);
                } catch (error) {
                    return false;
                }
            }

            // Considerar remoção do campo como alteração
            return newValue !== undefined && String(oldValue) !== String(newValue);
        });


        if (!hasChanges) {
            return res.status(400).json({ msg: "Não houve mudanças no evento, altere algo!" })
        }

        // Conversão dos valores da requisição
        const dateEvento = new Date(date); // Converte o dia para Date
        const dateNow = new Date();

        // validação da data do evento
        if (dateEvento.setHours(0, 0, 0, 0) < dateNow.setHours(0, 0, 0, 0)) {
            return res.status(400).json({ msg: "Insira uma data válida para seu evento!" });
        }

        // Validação de horário e conflito de eventos
        const eventByDataAndHouse = await Event.findOne({
            where: {
                house_id: house_id,
                date: date,
                [Op.or]: [
                    { startTime: { [Op.between]: [startTime, endTime] } },
                    { endTime: { [Op.between]: [startTime, endTime] } },
                    {
                        startTime: { [Op.lte]: startTime },
                        endTime: { [Op.gte]: endTime }
                    }
                ]
            }
        });

        // chamando a casa de show
        const house = await showHouse.findByPk(house_id)

        if (eventByDataAndHouse) {
            return res.status(409).json({ msg: `Ja existe um evento marcado nesse dia ${date} na casa ${house.name} nos horarios entre ${startTime}-${endTime}` })
        }

        await Event.update({ id, name, description, startTime, endTime, date, house_id, photos }, { where: { id: id } })
        return res.status(200).json({ msg: "Evento editado com sucesso!", eventEdited })


    } catch (error) {
        console.log("Erro com a rota de editar evento => ", error)
        return res.status(500).json({ msg: "Erro com a rota de editar evento => ", error })
    }
}

export async function getEventsByStatus(req,res){
    try {
        const {status} = req.body 

        const eventsByStatus = await Event.findAll({where: {status: status}})
        if(!eventsByStatus){
            return res.status(400).json({msg: `Nenhum evento encontrado com status ${status}`})
        }
        return res.status(200).json(eventsByStatus)
    } catch (error) {
        console.log("Erro com a rota de filtrar eventos pelo status => ", error)
        return res.status(500).json({ msg: "Erro com a rota de filtrar eventos pelo status", error })
    }
}