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
        console.log("Erro na rota de cadastro de usuário ==> ", error)
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
    const token = jwt.sign(userVerify.usuario_id, SECRET)
        return res.status(200).json({
            msg: "Usuário logado!",
            token,
            usuario_id: userVerify.usuario_id
        })

    } catch (error) {
        console.log("Erro na rota de login => " , error)
        return res.status(500).json({msg: "Erro na rota de login", error})
    }
}

// FUNÇÃO EDITAR USUARIO
export async function editUser(req, res) {
    try {
        // corpo da requisição
        const { usuario_id, name, email, password, phone, birth } = req.body;

        // validações
        if (!usuario_id) {
            return res.status(400).json({ msg: "ID do usuário é obrigatório!" });
        }
        if (!name) {
            return res.status(400).json({ msg: "Campo nome não pode estar vazio!" });
        }
        if (!email) {
            return res.status(400).json({ msg: "Campo email não pode estar vazio!" });
        }
        if (!phone) {
            return res.status(400).json({ msg: "Campo celular não pode estar vazio!" });
        }
        if (!birth) {
            return res.status(400).json({ msg: "Campo data nascimento não pode estar vazio!" });
        }

        // transformar a string 'birth' em data local (sem fuso horário afetando)
        const [year, month, day] = birth.split('-');
        const dateBirth = new Date(Number(year), Number(month) - 1, Number(day));

        const userEdited = { usuario_id, name, email, password, phone, dateBirth };

        // buscar usuário atual
        const user = await User.findByPk(usuario_id);
        if (!user) {
            return res.status(400).json({ msg: "Id inválido!" });
        }

        // verificar se houve mudanças
        const userDateBirth = new Date(user.birth);
        const hasChanges = Object.keys(userEdited).some(key => {
            if (key === 'dateBirth') {
                return userDateBirth.getTime() !== dateBirth.getTime();
            }
            return user[key] !== userEdited[key];
        });

        if (!hasChanges) {
            return res.status(404).json({ msg: "Não houve mudanças, altere algo!" });
        }

        // verificar duplicidade de email ou celular
        if (user.email !== email) {
            const emailVerify = await User.findOne({ where: { email } });
            if (emailVerify) {
                return res.status(409).json({ msg: "E-mail já existe!" });
            }
        }

        if (user.phone !== phone) {
            const phoneVerify = await User.findOne({ where: { phone } });
            if (phoneVerify) {
                return res.status(409).json({ msg: "Esse número de celular já está cadastrado!" });
            }
        }

        // hash da senha
        const salt = 12;
        const hashPassword = await bcrypt.hash(password, salt);

        // atualizar
        await User.update(
            {
                name,
                email,
                password: hashPassword,
                phone,
                birth: dateBirth
            },
            { where: { usuario_id } }
        );

        return res.status(200).json({ msg: "Usuário editado!", userEdited });

    } catch (error) {
        console.log("Erro na rota de edit usuario => ", error);
        return res.status(500).json({ msg: "Erro na rota de edit usuario", error });
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

// FUNÇÃO PARA BUSCAR USUÁRIO POR ID
export async function getUserById(req, res) {
    try {
        const { id } = req.params; // Pega o ID da URL (ex: /user/123)

        if (!id) {
            return res.status(400).json({ msg: "ID do usuário não foi fornecido!" });
        }

        const user = await User.findByPk(id); // Ou use: findOne({ where: { id: id } })

        if (!user) {
            return res.status(404).json({ msg: "Usuário não encontrado!" });
        }

        // Remova a senha do retorno por segurança
        const { password, ...userWithoutPassword } = user.dataValues;

        return res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.log("Erro ao buscar usuário por ID =>", error);
        return res.status(500).json({ msg: "Erro ao buscar usuário por ID", error });
    }
}
