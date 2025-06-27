import Event from "../models/event.js";
import Local from "../models/Local.js";
import Producer from '../models/Produtor.js';
import Usuario from '../models/user.js';
import { Op } from "sequelize";
import multer from 'multer';
import { uploadImageToExternalApi } from '../controllers/uploadImageController.js'; // Função para upload da imagem para a API externa
import { parse, isAfter } from 'date-fns';

Event.belongsTo(Local, {
    foreignKey: 'house_id',
    as: 'house', // <- este alias precisa bater com o que você usa no include
});

Event.belongsTo(Producer, {
    foreignKey: 'produtor_id',
    as: 'producer',
});

// Produtor.js
Producer.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'usuario'
});

// Configura o multer para armazenar a imagem na memória (não no disco)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('image'); // Assumindo que o campo é 'image'

export async function registerEvent(req, res) {
    try {
        const { name, description, startTime, endTime, dateStart, dateEnd, category, subject, house_id, photos, produtor_id } = req.body;

        // Validações de campos obrigatórios
        if (!name) return res.status(400).json({ msg: "Insira o nome do evento!" });
        if (!description) return res.status(400).json({ msg: "Insira a descrição do evento!" });
        if (!subject) return res.status(400).json({ msg: "Informe o assunto do evento!" });
        if (!house_id) return res.status(400).json({ msg: "Insira o local do evento!" });
        if (!dateStart) return res.status(400).json({ msg: "Insira o dia inicial do evento!" });
        if (!startTime) return res.status(400).json({ msg: "Insira o horario inicial do evento!" });
        if (!dateEnd) return res.status(400).json({ msg: "Insira o dia final do evento!" });
        if (!endTime) return res.status(400).json({ msg: "Insira o horario final do evento!" });

        // Verificação de existência do local
        const houseVerify = await Local.findByPk(house_id);
        if (!houseVerify) return res.status(400).json({ msg: "Id de local nao encontrado!" });

        // Conversão das datas
        const [year, month, day] = dateStart.split('-');
        const dateEventoStart = new Date(Number(year), Number(month) - 1, Number(day));
        const dateEventoEnd = new Date(dateEnd);
        const now = new Date();

        const start = new Date(dateEventoStart);
        start.setHours(0, 0, 0, 0);

        const end = new Date(dateEventoEnd);
        end.setHours(0, 0, 0, 0);

        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        // Validação das datas
        if (start < today || end < today) {
            return res.status(400).json({ msg: "Insira uma data válida para seu evento!" });
        }

        if (dateEnd < dateStart) {
            return res.status(400).json({ msg: "A data final não pode ser antes da data inicial!" });
        }

        // Verificação de horário
        if (dateStart === dateEnd) {
            const horaInicio = parse(startTime, "HH:mm", new Date());
            const horaFinal = parse(endTime, "HH:mm", new Date());

            if (isAfter(horaInicio, horaFinal)) {
                return res.status(400).json({ msg: "A hora inicial não pode ser maior que a hora final em eventos no mesmo dia!" });
            }
        }

        // Verificação de conflito de eventos
        const eventByDataAndHouse = await Event.findOne({
            where: {
                house_id: house_id,
                [Op.or]: [
                    { dateStart: { [Op.between]: [dateStart, dateEnd] } },
                    { dateEnd: { [Op.between]: [dateStart, dateEnd] } },
                    { dateStart: { [Op.lte]: dateStart }, dateEnd: { [Op.gte]: dateEnd } },
                    {
                        [Op.and]: [
                            { dateStart: { [Op.lte]: dateEnd } },
                            { dateEnd: { [Op.gte]: dateStart } },
                            { startTime: { [Op.gte]: endTime } }
                        ]
                    }
                ]
            }
        });

        if (eventByDataAndHouse) {
            return res.status(409).json({ msg: `Data indisponível!` });
        }

        // Verificação e upload da imagem para uma API externa
        let uploadedImageUrl = null;
        if (req.file) {
            // Envia a imagem diretamente para a API externa
            uploadedImageUrl = await uploadImageToExternalApi(req.file); // Chama a função de upload para a API externa
        }

        // Criando o evento
        const newEvent = await Event.create({
            name: name,
            description: description,
            dateStart: dateStart,
            dateEnd: dateEnd,
            house_id: house_id,
            photos: uploadedImageUrl || photos, // Usa a URL da imagem hospedada ou a do frontend
            startTime: startTime,
            endTime: endTime,
            subject: subject,
            category: category,
            produtor_id: produtor_id
        });

        return res.status(200).json({ msg: "Evento cadastrado!", newEvent });

    } catch (error) {
        console.log("Erro com a rota de cadastro de evento => ", error);
        return res.status(500).json(error);
    }
}

export async function getSearchEvent(req, res) {
    try {
        const name = req.params.name;

        let resultEvents;

        if (!name || name === "null") {
            // Busca todos os eventos
            resultEvents = await Event.findAll();
        } else {
            // Busca com filtro de nome
            resultEvents = await Event.findAll({
                where: {
                    name: {
                        [Op.like]: `%${name}%`
                    }
                }
            });
        }

        if (!resultEvents || resultEvents.length === 0) {
            return res.status(400).json({ msg: "Nenhum evento encontrado." });
        }

        return res.status(200).json(resultEvents);
    } catch (error) {
        console.log("Erro com a rota de pesquisa de eventos => ", error);
        return res.status(500).json({ msg: "Erro com a rota de pesquisa de eventos => ", error });
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

export async function getEventById(req, res) {
    try {
        const { id } = req.params;

        const event = await Event.findByPk(id, {
            include: [
                {
                    model: Local,
                    as: 'house',
                    attributes: { exclude: ['createdAt', 'updatedAt'] }
                },
                {
                    model: Producer,
                    as: 'producer',
                    attributes: { exclude: ['createdAt', 'updatedAt', 'password'] } // opcional
                }
            ]
        });

        if (!event) {
            return res.status(404).json({ msg: "Evento não encontrado" });
        }

        return res.status(200).json(event);
    } catch (error) {
        console.log("Erro ao buscar evento por ID =>", error);
        return res.status(500).json({ msg: "Erro ao buscar evento por ID", error });
    }
}

export async function getEventsByHouse(req, res) {
    try {
        // id do local
        const house_id = req.params.house_id
        // verificando a existencia dessa casa
        const house = await Local.findByPk(house_id)
        if (!house) {
            return res.status(400).json({ msg: "Casa de show não encontrada!" })
        }
        // buscando todos eventos desse local
        const eventsByHouse = await Event.findAll({ where: { house_id: house_id } })
        if (!eventsByHouse) {
            return res.status(400).json({ msg: `Nenhum evento encontrado na ${house.name}` })
        }
        // retornando valores
        return res.status(200).json(eventsByHouse)
    }
    catch (error) {
        console.log("Erro com a rota de evento por local => ", error)
        return res.status(500).json({ msg: "Erro com a rota de evento por local => ", error })
    }
}

export async function deleteEvent(req, res) {
    try {
        const id = req.params.id;

        // Verifica se o evento existe
        const eventVerify = await Event.findByPk(id);
        if (!eventVerify) {
            return res.status(400).json({ msg: "Id de evento não encontrado!" });
        }

        // Deleta o evento encontrado
        await eventVerify.destroy(); // Aqui usamos o evento já carregado para destruir, não precisa do "where"

        return res.status(200).json({ msg: "Evento excluído." });
    } catch (error) {
        console.log("Erro com a rota de deletar evento => ", error);
        return res.status(500).json({ msg: "Erro com a rota de deletar evento => ", error });
    }
}

export async function editEvent(req, res) {
    try {
        const {
            evento_id,
            name, description, startTime, endTime,
            dateStart, dateEnd, category, subject,
            house_id, photos, produtor_id
        } = req.body;

        const id = evento_id;

        // Verifica se o evento existe
        const existingEvent = await Event.findByPk(id);
        if (!existingEvent) {
            return res.status(404).json({ msg: "Evento não encontrado!" });
        }

        // Validações de campos obrigatórios
        if (!name) return res.status(400).json({ msg: "Insira o nome do evento!" });
        if (!description) return res.status(400).json({ msg: "Insira a descrição do evento!" });
        if (!subject) return res.status(400).json({ msg: "Informe o assunto do evento!" });
        if (!house_id) return res.status(400).json({ msg: "Insira o local do evento!" });
        if (!dateStart) return res.status(400).json({ msg: "Insira o dia inicial do evento!" });
        if (!startTime) return res.status(400).json({ msg: "Insira o horário inicial do evento!" });
        if (!dateEnd) return res.status(400).json({ msg: "Insira o dia final do evento!" });
        if (!endTime) return res.status(400).json({ msg: "Insira o horário final do evento!" });

        const houseVerify = await Local.findByPk(house_id);
        if (!houseVerify) return res.status(400).json({ msg: "Id de local não encontrado!" });

        // Validações de data
        const [year, month, day] = dateStart.split('-');
        const dateEventoStart = new Date(Number(year), Number(month) - 1, Number(day));
        const dateEventoEnd = new Date(dateEnd);
        const now = new Date();

        const start = new Date(dateEventoStart);
        start.setHours(0, 0, 0, 0);

        const end = new Date(dateEventoEnd);
        end.setHours(0, 0, 0, 0);

        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        if (start < today || end < today) {
            return res.status(400).json({ msg: "Insira uma data válida para seu evento!" });
        }

        if (dateEnd < dateStart) {
            return res.status(400).json({ msg: "A data final não pode ser antes da data inicial!" });
        }

        if (dateStart === dateEnd) {
            const horaInicio = parse(startTime, "HH:mm", new Date());
            const horaFinal = parse(endTime, "HH:mm", new Date());
            if (isAfter(horaInicio, horaFinal)) {
                return res.status(400).json({ msg: "A hora inicial não pode ser maior que a final!" });
            }
        }

        // Verifica conflito de eventos (ignora o próprio evento)
        const conflictEvent = await Event.findOne({
            where: {
                evento_id: { [Op.ne]: id },
                house_id: house_id,
                [Op.or]: [
                    { dateStart: { [Op.between]: [dateStart, dateEnd] } },
                    { dateEnd: { [Op.between]: [dateStart, dateEnd] } },
                    { dateStart: { [Op.lte]: dateStart }, dateEnd: { [Op.gte]: dateEnd } },
                    {
                        [Op.and]: [
                            { dateStart: { [Op.lte]: dateEnd } },
                            { dateEnd: { [Op.gte]: dateStart } },
                            { startTime: { [Op.gte]: endTime } }
                        ]
                    }
                ]
            }
        });

        if (conflictEvent) {
            return res.status(409).json({ msg: "Data indisponível!" });
        }

        // Upload da imagem (caso tenha sido enviada)
        let uploadedImageUrl = null;
        if (req.file) {
            uploadedImageUrl = await uploadImageToExternalApi(req.file);
        }

        // Atualização do evento
        await existingEvent.update({
            name,
            description,
            startTime,
            endTime,
            dateStart,
            dateEnd,
            category,
            subject,
            house_id,
            photos: uploadedImageUrl || photos,
            produtor_id
        });

        return res.status(200).json({ msg: "Evento atualizado com sucesso!", updatedEvent: existingEvent });
    } catch (error) {
        console.error("Erro na edição de evento =>", error);
        return res.status(500).json(error);
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

export async function getEventsByUser(req, res) {
    try {
        const user_id = req.params.id; // Obtendo o ID do usuário

        const events = await Event.findAll({
            include: [
                {
                    model: Producer,   // Associa o produtor ao evento
                    as: 'producer',    // Alias utilizado no 'belongsTo' no modelo 'Event
                    required: true,
                    include: {
                        model: Usuario, // Inclui os dados do usuário
                        as: 'usuario',  // Alias utilizado no 'belongsTo' no modelo 'Producer'
                        where: { usuario_id: user_id } // Filtro para o ID do usuário
                    }
                },
                {
                    model: Local,  // Inclui os dados do local (house)
                    as: 'house'    // Alias utilizado no 'belongsTo' no modelo 'Event'
                }
            ]
        });

        if (!events || events.length === 0) {
            return res.status(404).json({ msg: `Nenhum evento encontrado` });
        }

        return res.status(200).json(events);
    } catch (error) {
        console.error("Erro ao buscar eventos pelo usuário =>", error);
        return res.status(500).json({ msg: "Erro interno ao buscar eventos pelo usuário", error });
    }
}

export async function getEventDestaque(req, res) {
    try {
        const events = await Event.findAll({
            where: {
                bl_destaque: true
            },
            include: [
                {
                    model: Producer,
                    as: 'producer',
                    include: {
                        model: Usuario,
                        as: 'usuario'
                    }
                },
                {
                    model: Local,
                    as: 'house'
                }
            ]
        });

        if (!events || events.length === 0) {
            return res.status(404).json({ msg: `Nenhum evento em destaque encontrado.` });
        }

        return res.status(200).json(events);
    } catch (error) {
        console.error("Erro ao buscar eventos em destaque =>", error);
        return res.status(500).json({ msg: "Erro interno ao buscar eventos em destaque", error });
    }
}

export async function editDestaqueEvento(req,res){

    try {
        const {id} = req.params
        const evento_destaque = await Event.findByPk(id) 
        if(!evento_destaque){
            return res.status(400).json({msg: "Nenhum evento encontado!"})
        }
        evento_destaque.bl_destaque = true; 
        await evento_destaque.save();
    return res.status(200).json({msg: "Evento destacado!", evento_destaque})    
    } catch (error) {
        return res.status(500).json({msg: "Erro na rota de editar destaque no evento => ", error})
    }
} 
