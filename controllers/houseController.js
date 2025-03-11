import showHouse from "../models/showHouse.js";
import { Op } from "sequelize";
import { validateEmail } from "../helpers/validateEmail.js";
import { validateCEP } from "../helpers/validateCEP.js";

export async function registerHouse(req,res){

    try {
        const {name, address, city, state, zip_code, website, number, complemento } = req.body

        // validações
        if(!name){
            return res.status(400).json({msg: "Insira o nome da casa!"})
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

        // validar cep
        if(zip_code && !validateCEP(zip_code)){
            return res.status(400).json({msg: "CEP inválido!"})
        }

        const newShowHouse = await showHouse.create({
            name: name, 
            address: address,
            city: city,
            state: state,
            zip_code: zip_code,
            website: website,
            number: number, 
            complemento: complemento
        })

        return res.status(200).json({msg: "Casa de show cadastrada!", newShowHouse})



    } catch (error) {
        console.log("Erro na rota de cadastro de casa de show => " , error)
        return res.status(500).json({msg: "Erro na rota de cadastro de casa de show => ", error})
    }
}

export async function editHouse(req,res){
    try {
        const {house_id,name,  address, city, state, zip_code, website, number, complemento} = req.body 

    // validações
    const houseEdited = {house_id, name,  address, city, state, zip_code, website, number, complemento}
    // verificar se id está correto
    const houseVerify = await showHouse.findByPk(house_id)
    if(!houseVerify){
        return res.status(400).json({msg: "Id house inválido!"})
    }

    //nome
    if(!name){
        return res.status(400).json({msg: "Campo nome não pode estar vazio!"})
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

    // validar cep
    if(zip_code && !validateCEP(zip_code)){
        return res.status(400).json({msg: "CEP inválido!"})
    }

    const hasChanges = Object.keys(houseEdited).some(key => {
        const oldValue = houseVerify[key];  
        let newValue = houseEdited[key];
         
        // Considerar remoção do campo como alteração
        return newValue !== undefined && String(oldValue) !== String(newValue);
    });
    

    if(!hasChanges){
        return res.status(400).json({msg: "Não houve mudanças, altere algo!"})
   }

   if(zip_code){
    const cepVerify = await showHouse.findOne({where: {zip_code: zip_code}})
    if(cepVerify){
        return res.status(409).json({msg: "CEP já cadastrado!"})
    }
}

   
   await showHouse.update({name: name, address: address, city: city, state: state, zip_code: zip_code, website: website, number: number, complemento: complemento}, {where: {house_id: house_id}})
   return res.status(200).json({msg: "Casa de show editada!", houseEdited})
     
    } catch (error) {
        console.log("Erro na rota de edit de casa de show => " , error)
        return res.status(500).json({msg: "Erro na rota de edit de casa de show => ", error})

    }
}

export async function deleteHouse(req,res){
    try {
        const house_id = req.params.id 

        // validação
        const houseVerify = await showHouse.findByPk(house_id)
        if(!houseVerify){
            return res.status(400).json({msg: "Id inválido"})
        }
        
        await showHouse.destroy({where: {house_id: house_id}})
        return res.status(200).json({msg: "Casa de show excluida!"})   
    } catch (error) {
        console.log("Erro na rota de delete de casa de show => " , error)
        return res.status(500).json({msg: "Erro na rota de delete de casa de show => ", error})
    }
}

export async function getSearchHouse(req,res){
    const name = req.params.name 

    const resultHouses = await showHouse.findAll({
        where: {
            name: {
                [Op.like]: `%${name}%`
            }
        }
    })

    if(!resultHouses){
        return res.status(400).json({msg: "Nenhuma casa de show encontrada."})
    }

    return res.status(200).json(resultHouses)
}

export async function getHouseAll(req,res){
    try {
        const houses = await showHouse.findAll()

        if(!houses){
            return res.status(400).json({msg: "Nenhuma casa de show cadastrada"})
        }
    
        return res.status(400).json(houses)   
    } catch (error) {
        console.log("Erro na rota de get de todos casas de show => " , error)
        return res.status(500).json({msg: "Erro na rota de get de todos casas de show => ", error})
    }
}