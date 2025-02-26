import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { configDotenv } from 'dotenv'
configDotenv()
import User from '../models/user.js'

export async function getUsers(req,res){

    try {
        const users = await User.findAll()

        if(!users){
            console.log("Nenhum usuário encontrado!")
        }       
        
        return res.status(200).json(users)
    } catch (error) {
        console.log("Erro ao carregar os usuários do sistema")
    }
}

export async function registerUser(req, res){
    const {name, email, password, phone, birth} = req.body
}