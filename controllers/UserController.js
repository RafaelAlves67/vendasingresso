import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { configDotenv } from 'dotenv'
configDotenv()
import User from '../models/user.js'

const SECRET = process.env.SECRET


// FUNÇÃO DE REGISTRAR USUARIO
export async function registerUser(req, res){
    try {

        // corpo da requisição
        const {name, email, password, confirmPassword, phone, birth} = req.body 

    // validações 

    //nome
    if(!name){
        return res.status(400).json({msg: "Insira seu nome para completar o registro!"})
    }
    // email
    if(!email){
        return res.status(400).json({msg: "Insira um e-mail para completar o registro!"})
    }

    const emailVerify = await User.findOne({where: {email: email}}) 
    if(emailVerify){
        return res.status(409).json({msg: "E-mail já existe!"})
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(email)){
        return res.status(400).json({msg: "Insira um e-mail válido"})
    }
    
    // senhas
    if(!password){
        return res.status(400).json({msg: "Insira uma senha para completar o registro!"})
    }

    if(!confirmPassword){
        return res.status(400).json({msg: "Insira a confirmação de senha para completar o registro!"})
    }

    if(password !== confirmPassword){
        return res.status(400).json({msg: "As senhas para confirmação não coincidem!"})
    }

    // celular
    if(!phone){
        return res.status(400).json({msg: "Insira seu telefone para completar o registro!"})
    }

    if(phone.length !== 11){
        return res.status(400).json({msg: "Insira um número de celular válido"})
    }

    // verificar se phone ja exste
    const phoneExist = await User.findOne({where: {phone: phone}})
    if(phoneExist){
        return res.status(409).json({msg: "Celular ja está cadastrado em uma conta!"})
    }

    // data nascimento
    if(!birth){
        return res.status(400).json({msg: "Insira sua data de nascimento para completar o registro!"})
    }

    // transformando em data a string de data nascimento
    const dateBirth = new Date(birth)

    // pegando a data atual
    let dateNow = new Date();

    // comparando se é uma data valida
    if(dateBirth > dateNow){
        return res.status(400).json({msg: "Insira um data válida!"})
    }

    // criptografando a senha
    const salt = 12 
    const hashPassword = await bcrypt.hash(password, salt) 

    const newUser = await User.create({
        name: name,
        email: email,
        password: hashPassword,
        phone: phone,
        birth: dateBirth,
        role: 'Usuario'
    }) 

    return res.status(200).json({msg: "Usuário registrado!", newUser})

    } catch (error) {
        console.log("Erro na rota de cadastro de usuário => ", error)
        return res.status(500).json({msg: "Erro na rota de cadastro de usuário => ", error})
    }
}

// FUNÇÃO DE LOGIN
export async function loginUser(req, res){
    try {

        // corpo da requisição
        const {email, password} = req.body 

    // validações
    if(!email){
        return res.status(400).json({msg: "Insira seu email para realizar o login"})
    }

    if(!password){
        return res.status(400).json({msg: "Insira sua senha para realizar o login"})
    }

    // check se email existe 
    const userVerify = await User.findOne({where: {email: email}}) 
    if(!userVerify){
        return res.status(400).json({msg: "E-mail não encontrado!"})
    }

    // check senha 
    const isMatch = await bcrypt.compare(password, userVerify.password) 

    if(!isMatch){
        return res.status(401).json({msg: "Senha incorreta!"})
    }

    // gerar token para autenticação de login
    const token = jwt.sign(userVerify.id, SECRET)
    return res.status(200).json({msg: "Usuário logado!", token})

    } catch (error) {
        console.log("Erro na rota de login => " , error)
        return res.status(500).json({msg: "Erro na rota de login", error})
    }
}

// FUNÇÃO EDITAR USUARIO
export async function editUser(req,res){
    try {

    // corpo da requisição
    const {id , name, email, password, phone, birth} = req.body  
    
    // transformando em um objeto
    const dateBirth = new Date(birth)
    const userEdited = {id, name, email, password, phone, dateBirth}

    // validações 
    // id 
    const user = await User.findByPk(id) 
    if(!user){
        return res.status(400).json({msg: "Id inválido!"})
    }
   
    //nome
    if(!name){
        return res.status(400).json({msg: "Campo nome não pode estar vazio!"})
    }
    // email
    if(!email){
        return res.status(400).json({msg: "Campo email não pode estar vazio!"})
    }

    // senhas
    if(!password){
        return res.status(400).json({msg: "Campo senha não pode estar vazio!"})
    }

    // celular
    if(!phone){
        return res.status(400).json({msg: "Campo celular não pode estar vazio!"})
    }

    // data nascimento
    if(!birth){
        return res.status(400).json({msg: "Campo data nascimento não pode estar vazio!"})
    } 

    // verificando caso não tenha editado nada no usuario

    // transformando data do banco em um objeto de date javascript
    const userDateBirth = new Date(user.birth)

    // fazendo a comparação
    const hasChanges = Object.keys(userEdited).some(key => {
        if (key === 'dateBirth') {
            return userDateBirth.getTime() !== dateBirth.getTime();
        }
        return user[key] !== userEdited[key];
    });

    if(!hasChanges){
        return res.status(404).json({msg: "Não houve mudanças, altere algo!"})
   }

   // verificar se caso a edição for email ou phone, se ja existe esse novo valor cadastrado 
   if(user.email !== email){
        const emailVerify = await User.findOne({where: {email: email}}) 

        if(emailVerify){
            return res.status(409).json({msg: "E-mail ja existe!"})
        }
   }

   if(user.phone !== phone){
        const phoneVerify = await User.findOne({where: {phone: phone}}) 

        if(phoneVerify){
            return res.status(409).json({msg: "Esse número de celular ja está cadastrado!"})
        }
   }

    await User.update({name: name, email: email, password: password, phone: phone, birth: dateBirth}, {where: {id: id}})
    return res.status(200).json({msg: "Usuário editado!", userEdited})

    } catch (error) {
        console.log("Erro na rota de edit usuario => " , error)
        return res.status(500).json({msg: "Erro na rota de edit usuario", error})
    }
}

// FUNÇÃO DELETAR USUARIO
export async function deleterUser(req,res){
    try{
        const {id} = req.params
        const userExist = await User.findByPk(id) 
        if(!userExist){
            return res.status(404).json({msg: "Usuário não encontrado"})
        }  

        await User.destroy({where: {id: id}}) 
        return res.status(200).json({msg: "Usuário excluido"})
    }catch(error){
        console.log("Erro com a rota delete: " + error)
        return res.status(500).json({msg: "Erro na rota de delete usuario", error})
    }
}

