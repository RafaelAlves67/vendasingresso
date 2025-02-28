import showHouse from "../models/showHouse.js";
import { validateEmail } from "../helpers/validateEmail.js";
import { validateCEP } from "../helpers/validateCEP.js";

export async function registerHouse(req,res){

    try {
        const {name, capacity, address, city, state, zip_code, phone, email, website, photos } = req.body

        // validações
        if(!name){
            return res.status(400).json({msg: "Insira o nome da casa!"})
        }

        if(!capacity){
            return res.status(400).json({msg: "Insira a capacidade total da casa!"})
        }

        if(!address){
            return res.status(400).json({msg: "Insira o endereço da casa!"})
        }

        if(!city){
            return res.status(400).json({msg: "Insira a cidade da casa!"})
        }

        if(!state){
            return res.status(400).json({msg: "Insira o estado da casa!"})
        }

        if(!zip_code){
            return res.status(400).json({msg: "Insira o CEP da casa!"})
        }

        // validar se existe casa ja no mesmo cep 
        const houseVerifyCEP = await showHouse.findOne({where: {zip_code: zip_code}})
        if(houseVerifyCEP){
            return res.status(409).json({msg: "CEP ja cadastrado!"})
        }

        // validar numero valido 
        if(phone){
           if(phone.length !== 11){
                return res.status(400).json({msg: "Insira um número de celular válido!"})
           }
        }

        // validar email
        if(email && !validateEmail(email)){      
            return res.status(400).json({msg: "E-mail inválido!"})
        }

        // validar cep
        if(zip_code && !validateCEP(zip_code)){
            return res.status(400).json({msg: "CEP inválido!"})
        }

        const newShowHouse = await showHouse.create({
            name: name, 
            capacity: capacity,
            address: address,
            city: city,
            state: state,
            zip_code: zip_code,
            phone: phone,
            email: email,
            website: website,
            photos: photos
        })

        return res.status(200).json({msg: "Casa de show cadastrada!", newShowHouse})



    } catch (error) {
        console.log("Erro na rota de cadastro de casa de show => " , error)
        return res.status(500).json({msg: "Erro na rota de cadastro de casa de show => ", error})
    }
}

export async function editHouse(req,res){
    try {
        const {id,name, capacity, address, city, state, zip_code, phone, email, website, photos } = req.body 

    // validações
    const houseEdited = {id,name, capacity, address, city, state, zip_code, phone, email, website, photos}
    // verificar se id está correto
    const houseVerify = await showHouse.findByPk(id)
    if(!houseVerify){
        return res.status(400).json({msg: "Id house inválido!"})
    }

    //nome
    if(!name){
        return res.status(400).json({msg: "Campo nome não pode estar vazio!"})
    }

    // capacidade
    if(!capacity){
        return res.status(400).json({msg: "Campo capacidade não pode estar vazio!"})
    }

    // endereço
    if(!address){
        return res.status(400).json({msg: "Campo endereço não pode estar vazio!"})
    } 
    // cidade
    if(!city){
        return res.status(400).json({msg: "Campo cidade não pode estar vazio!"})
    } 
    // estado
    if(!state){
        return res.status(400).json({msg: "Campo estado não pode estar vazio!"})
    } 
    // CEP
    if(!zip_code){
        return res.status(400).json({msg: "Campo CEP não pode estar vazio!"})
    } 

    // validar email
    if(email && !validateEmail(email)){      
            return res.status(400).json({msg: "E-mail inválido!"})
    }

    // validar cep
    if(zip_code && !validateCEP(zip_code)){
        return res.status(400).json({msg: "CEP inválido!"})
    }

    // validar phone
    if(phone && phone.length !== 11){
        return res.status(400).json({msg: "Insira um número de celular válido!"})
    }

    // VERIFICAR SE HOUVE MUDANÇAS
    const hasChanges = Object.keys(houseEdited).some(key => {
        if (key === 'photos') {
            return JSON.stringify(houseVerify[key]) !== JSON.stringify(houseEdited[key]);
        }
        return houseVerify[key] !== houseEdited[key]
    })

    if(!hasChanges){
        return res.status(400).json({msg: "Não houve mudanças, altere algo!"})
   }

   const houseUpdate = await showHouse.update(houseEdited, {where: {id: id}})
   return res.status(200).json({msg: "Casa de show editada!", houseUpdate})
     
    } catch (error) {
        console.log("Erro na rota de cadastro de casa de show => " , error)
        return res.status(500).json({msg: "Erro na rota de edit de casa de show => ", error})

    }
}