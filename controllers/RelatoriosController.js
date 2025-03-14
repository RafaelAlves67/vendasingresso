import Event from "../models/event.js";
import itemCompra from "../models/ItemCompra.js"
import Ingresso from "../models/Ingresso";
import Compra from "../models/Compra.js";
import User from "../models/user.js";
import { Op } from "sequelize";

export async function listEventos_Vendas(req,res){
    try {
        const {evento_id} = req.body 

        const eventos = await Event.findAll({
            where: {
                evento_id: evento_id
            },
            include: [
                {
                    model: Ingresso,
                },
            ]
        })
        if(!eventos){
            return res.status(400).json({msg: "Id de evento não encontrado."})
        }   

        return res.status(200).json(eventos)

    } catch (error) {
        console.log("Erro na rota de listar os eventos e suas vendas => " , error)
        return res.status(500).json({msg: "Erro na rota de listar os eventos e suas vendas => " , error})
    }   
}

export async function listEventosAll(req,res){
    try {
        const {usuario_id} = req.body 

      
        const eventos_usuario = await Event.findAll({
            where: {
                usuario_id: usuario_id
            },
            include: [
                {
                    model: Ingresso,
                    include: [
                        {
                            model: itemCompra,
                            include: [
                                {
                                    model: Compra
                                }
                            ]
                        }
                    ]
                }
            ]
        })
    
        if(!eventos_usuario || eventos_usuario.length === 0){
            return res.status(400).json({msg: "Nenhum evento encontrado!"})
        }
        
        return res.status(200).json(eventos_usuario)        
    } catch (error) {
        console.log("Erro na rota de listar todos eventos do usuario => ", error)
        return res.status(500).json({msg: "Erro na rota de listar todos eventos do usuario  => ", error})
    }
}

export async function listEventosUltimos12meses(req,res){
    try {
        const {usuario_id} = req.body 

        const dateNow = new Date() 
        const date1anoatras = new Date()
        date1anoatras.setFullYear(dateNow.getFullYear() - 1); 
    
        const eventos_usuario = await Event.findAll({
            where: {
                usuario_id: usuario_id,
                dateEnd: {[Op.between]: [date1anoatras,dateNow]}
            },
            include: [
                {
                    model: Ingresso,
                    include: [
                        {
                            model: itemCompra,
                            include: [
                                {
                                    model: Compra
                                }
                            ]
                        }
                    ]
                }
            ]
        })
    
        if(!eventos_usuario || eventos_usuario.length === 0){
            return res.status(400).json({msg: "Nenhum evento encontrado!"})
        }
        
        return res.status(200).json(eventos_usuario)        
    } catch (error) {
        console.log("Erro na rota de listar eventos nos ultimos 12 meses => ", error)
        return res.status(500).json({msg: "Erro na rota de listar eventos nos ultimos 12 meses => ", error})
    }

}

export async function listEventosUltimos6meses(req,res){
    try {
        const {usuario_id} = req.body 

        const dateNow = new Date() 
        const date6mesesAtras = new Date()
        date6mesesAtras.setMonth(dateNow.getMonth() - 6); 
        date6mesesAtras.setDate(1)
    
        const eventos_usuario = await Event.findAll({
            where: {
                usuario_id: usuario_id,
                dateEnd: {[Op.between]: [date6mesesAtras,dateNow]}
            },
            include: [
                {
                    model: Ingresso,
                    include: [
                        {
                            model: itemCompra,
                            include: [
                                {
                                    model: Compra
                                }
                            ]
                        }
                    ]
                }
            ]
        })
    
        if(!eventos_usuario || eventos_usuario.length === 0){
            return res.status(400).json({msg: "Nenhum evento encontrado!"})
        }
        
        return res.status(200).json(eventos_usuario)        
    } catch (error) {
        console.log("Erro na rota de listar eventos nos ultimos 6 meses => ", error)
        return res.status(500).json({msg: "Erro na rota de listar eventos nos ultimos 6 meses => ", error})
    }
}

export async function listEventosUltimos30dias(req,res){
    try {
        const {usuario_id} = req.body 

        const dateNow = new Date() 
        const date30diasAtras = new Date()
        date30diasAtras.setDate(dateNow.getDate() - 30)
    
        const eventos_usuario = await Event.findAll({
            where: {
                usuario_id: usuario_id,
                dateEnd: {[Op.between]: [date30diasAtras,dateNow]}
            },
            include: [
                {
                    model: Ingresso,
                    include: [
                        {
                            model: itemCompra,
                            include: [
                                {
                                    model: Compra
                                }
                            ]
                        }
                    ]
                }
            ]
        })
    
        if(!eventos_usuario || eventos_usuario.length === 0){
            return res.status(400).json({msg: "Nenhum evento encontrado!"})
        }
        
        return res.status(200).json(eventos_usuario)        
    } catch (error) {
        console.log("Erro na rota de listar eventos nos ultimos 30 dias => ", error)
        return res.status(500).json({msg: "Erro na rota de listar eventos nos ultimos 30 dias => ", error})
    }
}


