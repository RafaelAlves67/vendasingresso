import Event from "../models/event.js";
import showHouse from "../models/showHouse.js";
import { Op } from "sequelize";
import Ticket from "../models/Ingresso.js";

export async function registerEvent(req, res) {

    try {
        const { name, description, startTime, endTime, dateStart, dateEnd, category, subject, house_id, photos} = req.body
        
        // validações 
        if (!name) {
            return res.status(400).json({ msg: "Insira o nome do evento!" })
        }

        if (!description) {
            return res.status(400).json({ msg: "Insira a descrição do evento!" })
        }

        if (!subject) {
            return res.status(400).json({ msg: "Informe o assunto do evento!" })
        }

        if (!house_id) {
            return res.status(400).json({ msg: "Insira a casa de show do evento!" })
        }

        if (!dateStart) {
            return res.status(400).json({ msg: "Insira o dia inicial do evento!" })
        }

        if (!startTime) {
            return res.status(400).json({ msg: "Insira o horario inicial do evento!" })
        }

        if (!dateEnd) {
            return res.status(400).json({ msg: "Insira o dia final do evento!" })
        }


        if (!endTime) {
            return res.status(400).json({ msg: "Insira o horario final do evento!" })
        }

        // Conversão dos valores da requisição
        const dateEventoStart = new Date(dateStart); // Converte a data para Date
        const dateEventoEnd = new Date(dateEnd); // Converte a data para Date
        const dateNow = new Date();

        // validação da data do evento
        if (dateEventoStart.setHours(0, 0, 0, 0) < dateNow.setHours(0, 0, 0, 0 ) || dateEventoEnd.setHours(0, 0, 0, 0) < dateNow.setHours(0, 0, 0, 0 )) {
            return res.status(400).json({ msg: "Insira uma data válida para seu evento!" });
        }

        if(dateEnd < dateStart){
            return res.status(400).json({ msg: "A data final não pode ser antes da data inicial!" });
        }

        // Validação de horário e conflito de eventos
        const eventByDataAndHouse = await Event.findOne({
            where: {
                house_id: house_id,
                [Op.or]: [
                    {
                        // Caso 1: O evento existente começa dentro do intervalo do novo evento
                        dateStart: { [Op.between]: [dateStart, dateEnd] }
                    },
                    {
                        // Caso 2: O evento existente termina dentro do intervalo do novo evento
                        dateEnd: { [Op.between]: [dateStart, dateEnd] }
                    },
                    {
                        // Caso 3: O evento existente envolve completamente o novo evento
                        dateStart: { [Op.lte]: dateStart },
                        dateEnd: { [Op.gte]: dateEnd }
                    },
                    {
                        // Caso 4: Evento existente atravessa a meia-noite
                        dateStart: { [Op.lte]: dateEnd },
                        dateEnd: { [Op.gte]: dateStart }
                    }
                ],
                [Op.or]: [
                    // Eventos que começam e terminam no mesmo dia
                    { 
                        startTime: { [Op.between]: [startTime, endTime] } 
                    },
                    { 
                        endTime: { [Op.between]: [startTime, endTime] } 
                    },
                    { 
                        startTime: { [Op.lte]: startTime }, 
                        endTime: { [Op.gte]: endTime }
                    },
                    // Eventos que atravessam a meia-noite
                    {
                        startTime: { [Op.gte]: startTime }, // Começa antes da meia-noite
                        endTime: { [Op.lte]: endTime }, // Termina depois da meia-noite
                        dateStart: { [Op.lt]: dateEnd } // Atravessa para o dia seguinte
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
            dateStart: dateStart,
            dateEnd: dateEnd,
            house_id: house_id,
            photos: photos,
            startTime: startTime,
            endTime: endTime,
            subject: subject,
            category: category
        })

        return res.status(200).json({ msg: "Evento cadastrado!", newEvent })

    } catch (error) {
        console.log("Erro com a rota de cadastro de evento => ", error)
        return res.status(500).json(error)
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

        const { evento_id, name, description, startTime, endTime, date, house_id, photos, subject, category, dateStart, dateEnd  } = req.body
        const eventEdited = { evento_id, name, description, startTime, endTime, date, house_id, photos, subject, category, dateStart, dateEnd  }
    
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

        if (!dateStart) {
            return res.status(400).json({ msg: "Insira o dia inicial do evento!" })
        }


        if (!startTime) {
            return res.status(400).json({ msg: "Insira o horario inicial do evento!" })
        }

        if (!dateEnd) {
            return res.status(400).json({ msg: "Insira o dia final do evento!" })
        }


        if (!endTime) {
            return res.status(400).json({ msg: "Insira o horario final do evento!" })
        }

        if (!subject) {
            return res.status(400).json({ msg: "Informe o assunto do evento!" })
        }
        
        const eventVerify = await Event.findByPk(evento_id)
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
        const dateEventoStart = new Date(dateStart); // Converte a data para Date
        const dateEventoEnd = new Date(dateEnd); // Converte a data para Date
        const dateNow = new Date();

        // validação da data do evento
        if (dateEventoStart.setHours(0, 0, 0, 0) < dateNow.setHours(0, 0, 0, 0 ) || dateEventoEnd.setHours(0, 0, 0, 0) < dateNow.setHours(0, 0, 0, 0 )) {
            return res.status(400).json({ msg: "Insira uma data válida para seu evento!" });
        }

        if(dateEnd < dateStart){
            return res.status(400).json({ msg: "A data final não pode ser antes da data inicial!" });
        }

        // Validação de horário e conflito de eventos
        const eventByDataAndHouse = await Event.findOne({
            where: {
                house_id: house_id,
                [Op.or]: [
                    {
                        // Caso 1: O evento existente começa dentro do intervalo do novo evento
                        dateStart: { [Op.between]: [dateStart, dateEnd] }
                    },
                    {
                        // Caso 2: O evento existente termina dentro do intervalo do novo evento
                        dateEnd: { [Op.between]: [dateStart, dateEnd] }
                    },
                    {
                        // Caso 3: O evento existente envolve completamente o novo evento
                        dateStart: { [Op.lte]: dateStart },
                        dateEnd: { [Op.gte]: dateEnd }
                    },
                    {
                        // Caso 4: Evento existente atravessa a meia-noite
                        dateStart: { [Op.lte]: dateEnd },
                        dateEnd: { [Op.gte]: dateStart }
                    }
                ],
                [Op.or]: [
                    // Eventos que começam e terminam no mesmo dia
                    { 
                        startTime: { [Op.between]: [startTime, endTime] } 
                    },
                    { 
                        endTime: { [Op.between]: [startTime, endTime] } 
                    },
                    { 
                        startTime: { [Op.lte]: startTime }, 
                        endTime: { [Op.gte]: endTime }
                    },
                    // Eventos que atravessam a meia-noite
                    {
                        startTime: { [Op.gte]: startTime }, // Começa antes da meia-noite
                        endTime: { [Op.lte]: endTime }, // Termina depois da meia-noite
                        dateStart: { [Op.lt]: dateEnd } // Atravessa para o dia seguinte
                    }
                ]
            }
        });
        
        if (eventByDataAndHouse) {
            return res.status(409).json({ msg: `Ja existe um evento marcado nesse dia ${date} na casa ${houseVerify.name} nos horarios entre ${startTime}-${endTime}` })
        }

        await Event.update({ id, name, description, startTime, endTime, date, house_id, photos, ctrlLoteBool, qtde_ticket, default_price }, { where: { id: id } })
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