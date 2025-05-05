import Event from "../models/event.js"
import Ingresso from "../models/Ingresso.js"
import ItemCompra from "../models/ItemCompra.js";
import Lote from "../models/Lote.js"
import { parse , isAfter, isEqual} from "date-fns";

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

        const allTickets = [] // Lista para armazenar todos ingressos

        for (let ticket of tickets) {
            // VALIDAÇÕES
            if (!ticket.titulo) {
                return res.status(400).json({ msg: "Informe o título do ingresso" })
            }

            if (!ticket.quantidade_total) {
                return res.status(400).json({ msg: "Informe o a quantidade de ingresso" })
            }

            if (!ticket.valor) {
                return res.status(400).json({ msg: "Informe o valor do ingresso" })
            }

            if (!ticket.periodo_vendas_tipo) {
                return res.status(400).json({ msg: "Informe o tipo de período de vendas do ingresso" })
            }

            if (!ticket.data_inicio_vendas) {
                return res.status(400).json({ msg: "Informe a Data de Início das Vendas do ingresso" })
            }

            if (!ticket.hora_inicio_vendas) {
                return res.status(400).json({ msg: "Informe a hora de início das Vendas" })
            }

            if (!ticket.data_termino_vendas) {
                return res.status(400).json({ msg: "Informe a Data Término das Vendas" })
            }

            if (!ticket.hora_termino_vendas) {
                return res.status(400).json({ msg: "Informe a hora de témino das Vendas" })
            }

            if (!ticket.quantidade_minima_por_compra) {
                return res.status(400).json({ msg: "Informe o título do ingresso" })
            }

            if (!ticket.quantidade_maxima_por_compra) {
                return res.status(400).json({ msg: "Informe o título do ingresso" })
            }

            if(ticket.periodo_vendas_tipo !== 'Por Data' && ticket.periodo_vendas_tipo !== 'Por Lote'){
                return res.status(400).json({ msg: "Periodo de vendas inválido" })
            }

            // Conversão dos valores da requisição
            const [yearStart, monthStart, dayStart] = ticket.data_inicio_vendas.split('-');
            const [yearEnd, monthEnd, dayEnd] = ticket.data_termino_vendas.split('-');

            const dateIngressoStart = new Date(Number(yearStart), Number(monthStart) - 1, Number(dayStart));
            const dateIngressoEnd = new Date(Number(yearEnd), Number(monthEnd) - 1, Number(dayEnd));
            const now = new Date();

            const start = new Date(dateIngressoStart);
            start.setHours(0, 0, 0, 0);

            const end = new Date(dateIngressoEnd);
            end.setHours(0, 0, 0, 0);

            const today = new Date(now);
            today.setHours(0, 0, 0, 0);

            // validação da data do ingresso
            if (start < today || end < today) {
                return res.status(400).json({ msg: "Insira uma data válida para seu ingresso!" });
            }


            if (dateIngressoEnd < dateIngressoStart) {
                return res.status(400).json({ msg: "A data final não pode ser antes da data inicial!" });
            }

            if (isEqual(parse(ticket.data_inicio_vendas, "yyyy-MM-dd", new Date()), parse(ticket.data_termino_vendas, "yyyy-MM-dd", new Date()))) {
                const horaInicio = parse(ticket.hora_inicio_vendas, "HH:mm", new Date());
                const horaFinal = parse(ticket.hora_termino_vendas, "HH:mm", new Date());
            
                if (isAfter(horaInicio, horaFinal)) {
                    return res.status(400).json({ msg: "A hora inicial não pode ser maior que a hora final em eventos no mesmo dia!" });
                }
            }

            // declarando id do evento nos ingressos
            ticket.evento_id = evento_id

            // adicionando ingressos princial
            allTickets.push(ticket)

            // criando ingresso meia entrada
            if (ticket.meia_entrada) {

                if (!ticket.quantidade_meia_entrada) {
                    return res.status(400).json({ msg: "Informe a quantidade de ingresso meia-entrada" });
                }

                let meiaEntrada = {
                    ...ticket,
                    titulo: `${ticket.titulo} (Meia-Entrada)`, // Adiciona o sufixo
                    valor: Math.floor(ticket.valor / 2), // Define o preço da meia-entrada
                    quantidade_total: ticket.quantidade_meia_entrada, // Define a quantidade da meia-entrada
                }

                // adicionando ingressos meia-entrada
                allTickets.push(meiaEntrada)
            }

            ticket.meia_entrada = false;
        }


            const novosIngressos = await Ingresso.bulkCreate(allTickets)

            // criar lotes para ingressos do tipo "Por Lote"
            for (let i = 0; i < allTickets.length; i++) {
                if (allTickets[i].periodo_vendas_tipo === 'Por Lote') {
                    await Lote.create({
                        data_termino_vendas: allTickets[i].data_termino_vendas,
                        hora_termino_vendas: allTickets[i].hora_termino_vendas,
                        ingresso_id: novosIngressos[i].ingresso_id 
                    });
                }
            }
        

        return res.status(200).json({ msg: "Ingressos cadastrado", novosIngressos })

    } catch (error) {
        console.log("Erro na rota de cadastro de ingresso => ", error)
        return res.status(501).json({ msg: "Erro na rota de cadastro de ingresso => ", error })
    }
}

export async function deleteTicket(req, res) {
    try {
        const ingresso_id = req.params.id

        // validação
        const ingressoVerify = await Ingresso.findByPk(ingresso_id)
        if (!ingressoVerify) {
            return res.status(400).json({ msg: "Id inválido" })
        }

            
      //  await ItemCompra.destroy({where: {ingresso_id: ingresso_id }})
        await Ingresso.destroy({ where: { ingresso_id: ingresso_id } })

        return res.status(200).json({ msg: "Ingresso excluido!" })
    } catch (error) {
        console.log("Erro na rota de deletar ingresso => ", error)
        return res.status(500).json({ msg: "Erro na rota de deletar ingresso => ", error })
    }
}

export async function editTicket(req, res) {
    try {
        const ticket = req.body

        if (!ticket.evento_id) {
            return res.status(400).json({ msg: "Informe o id do evento" })
        }

        const evento = await Event.findByPk(ticket.evento_id)
        if (!evento) {
            return res.status(400).json({ msg: "Id do evento inválido" })
        }
        // EXTRAIR INGRESSO
        const ingresso = await Ingresso.findByPk(ticket.ingresso_id)
        if (!ingresso) {
            return res.status(400).json({ msg: "Id do ingresso inválido" })
        }

        // VALIDAÇÕES
        if (!ticket.titulo) {
            return res.status(400).json({ msg: "Informe o título do ingresso" })
        }

        if (!ticket.quantidade_total) {
            return res.status(400).json({ msg: "Informe o a quantidade de ingresso" })
        }

        if (!ticket.valor) {
            return res.status(400).json({ msg: "Informe o valor do ingresso" })
        }

        if (!ticket.periodo_vendas_tipo) {
            return res.status(400).json({ msg: "Informe o tipo de período de vendas do ingresso" })
        }

        if (!ticket.data_inicio_vendas) {
            return res.status(400).json({ msg: "Informe a Data de Início das Vendas do ingresso" })
        }

        if (!ticket.hora_inicio_vendas) {
            return res.status(400).json({ msg: "Informe a hora de início das Vendas" })
        }

        if (!ticket.data_termino_vendas) {
            return res.status(400).json({ msg: "Informe a Data Término das Vendas" })
        }

        if (!ticket.hora_termino_vendas) {
            return res.status(400).json({ msg: "Informe a hora de témino das Vendas" })
        }

        if (!ticket.quantidade_minima_por_compra) {
            return res.status(400).json({ msg: "Informe a quantidade minima por compra" })
        }

        if (!ticket.quantidade_maxima_por_compra) {
            return res.status(400).json({ msg: "Informe a quantidade maxima por compra" })
        }

        if(ticket.periodo_vendas_tipo !== 'Por Data' && ticket.periodo_vendas_tipo !== 'Por Lote'){
            return res.status(400).json({ msg: "Periodo de vendas inválido" })
        }

        if(ticket.quantidade_maxima_por_compra < ticket.quantidade_minima_por_compra){
             return res.status(400).json({msg: "A quantidade maxima deve ser maior que a quantidade minima."})
        }

        if(ticket.quantidade_total < ticket.quantidade_vendida){
            return res.status(400).json({msg: "A quantidade total deve ser maior ou igual a quantidade vendida."})
        }

    
        // Conversão dos valores da requisição
        const dateIngressoStart = new Date(ticket.data_inicio_vendas); // Converte a data para Date
        const dateIngressoEnd = new Date(ticket.data_termino_vendas); // Converte a data para Date
        const dateNow = new Date();

        // validação da data do evento
        if (dateIngressoStart.setHours(0, 0, 0, 0) < dateNow.setHours(0, 0, 0, 0) || dateIngressoEnd.setHours(0, 0, 0, 0) < dateNow.setHours(0, 0, 0, 0)) {
            return res.status(400).json({ msg: "Insira uma data válida para seu ingresso!" });
        }

        if (dateIngressoEnd < dateIngressoStart) {
            return res.status(400).json({ msg: "A data final não pode ser antes da data inicial!" });
        }

        if (isEqual(parse(ticket.data_inicio_vendas, "yyyy-MM-dd", new Date()), parse(ticket.data_termino_vendas, "yyyy-MM-dd", new Date()))) {
            const horaInicio = parse(ticket.hora_inicio_vendas, "HH:mm", new Date());
            const horaFinal = parse(ticket.hora_termino_vendas, "HH:mm", new Date());
        
            if (isAfter(horaInicio, horaFinal)) {
                return res.status(400).json({ msg: "A hora inicial não pode ser maior que a hora final em eventos no mesmo dia!" });
            }
        }

        const ingressoData = ingresso.get({ plain: true }); // Remove metadata do Sequelize
        const ticketData = { ...ticket };

        // Remover campos que não devem ser comparados
        delete ingressoData.ingresso_id;
        delete ingressoData.evento_id;
        delete ingressoData.createdAt;
        delete ingressoData.updatedAt;
        delete ticketData.ingresso_id;
        delete ticketData.evento_id;
        delete ticketData.createdAt;
        delete ticketData.updatedAt;

        // Verificação campo por campo
        const hasChanges = Object.keys(ingressoData).some((key) => {
            const oldValue = ingressoData[key]; // Valor do banco
            const newValue = ticketData[key]; // Novo valor da requisição

            // Normalizar datas para string no formato YYYY-MM-DD
            if (key.includes("data")) {
                const oldDate = oldValue ? new Date(oldValue).toISOString().split("T")[0] : null;
                const newDate = newValue ? new Date(newValue).toISOString().split("T")[0] : null;
                return oldDate !== newDate;
            }

            // Comparação padrão
            return String(oldValue).trim() !== String(newValue).trim();
        });

        if (!hasChanges) {
            return res.status(400).json({ msg: "Não houve mudanças, altere algo" });
        }



        await ingresso.update(ticket, { ingresso_id: ticket.id })
        return res.status(200).json({ msg: "Ingresso alterado", ticket })
    } catch (error) {
        console.log("Erro na rota de editar ingresso => ", error)
        return res.status(500).json({ msg: "Erro na rota de editar ingresso => ", error })
    }

}

export async function listarIngressosPorEvento(req, res) {
    const { evento_id } = req.query;

    if (!evento_id) {
        return res.status(400).json({ msg: "Evento não encontrado!" });
    }

    try {
        const eventos = await Event.findAll({
            where: { evento_id },
            include: [
                {
                    model: Ingresso,
                    required: false, // Para permitir eventos sem ingressos
                },
            ],
        });

        // Verifica se existem eventos e ingressos e retorna somente os ingressos
        if (!eventos || eventos.length === 0) {
            return res.status(404).json({ msg: "Nenhum ingresso encontrado para este evento." });
        }

        // Aqui, extraímos apenas os ingressos
        const ingressos = eventos.flatMap(evento => evento.Ingressos);

        return res.status(200).json(ingressos); // Retorna apenas os ingressos
    } catch (error) {
        console.error("Erro ao listar ingressos do evento:", error);
        return res.status(500).json({ msg: "Erro ao listar ingressos do evento", error });
    }
}

