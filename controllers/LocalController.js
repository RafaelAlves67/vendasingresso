import Local from "../models/Local.js";
import { Op } from "sequelize";
import { validateEmail } from "../helpers/validateEmail.js";
import { validateCEP } from "../helpers/validateCEP.js";

export async function registerHouse(req,res){

    try {
        const {name, address, city, state, zip_code, website, number, complemento } = req.body

        // validações
        if(!name){
            return res.status(400).json({msg: "Insira o nome do local!"})
        }

        if(!address){
            return res.status(400).json({msg: "Insira o endereço do local!"})
        }

        if(!city){
            return res.status(400).json({msg: "Insira a cidade do local!"})
        }

        if(!state){
            return res.status(400).json({msg: "Insira o estado do local!"})
        }

        if(!zip_code){
            return res.status(400).json({msg: "Insira o CEP do local!"})
        }

        if(!number){
             return res.status(400).json({msg: "Insira o número do local!"})
        }

        // validar se existe casa ja no mesmo cep 
        const houseVerifyCEP = await Local.findOne({where: {zip_code: zip_code}})
        if(houseVerifyCEP){
            return res.status(409).json({msg: "CEP ja cadastrado!"})
        }

        // validar cep
        /* if(zip_code && !validateCEP(zip_code)){
            return res.status(400).json({msg: "CEP inválido!"})
        } */

        const newLocal = await Local.create({
            name: name, 
            address: address,
            city: city,
            state: state,
            zip_code: zip_code,
            website: website,
            number: number, 
            complemento: complemento
        })

        return res.status(200).json({ msg: "Local cadastrado!", id: newLocal.id, newLocal });



    } catch (error) {
        console.log("Erro na rota de cadastro de Local => " , error)
        return res.status(500).json({msg: "Erro na rota de cadastro de Local => ", error})
    }
}

export async function editHouse(req, res) {
    try {
        const {
            house_id,
            name,
            address,
            city,
            state,
            zip_code,
            website,
            number,
            complemento
        } = req.body;

        // Validações básicas
        if (!house_id) {
            return res.status(400).json({ msg: "ID do local é obrigatório!" });
        }

        const houseVerify = await Local.findByPk(house_id);
        if (!houseVerify) {
            return res.status(400).json({ msg: "Id house inválido!" });
        }

        if (!name) {
            return res.status(400).json({ msg: "Campo nome não pode estar vazio!" });
        }

        if (!address) {
            return res.status(400).json({ msg: "Campo endereço não pode estar vazio!" });
        }

        if (!city) {
            return res.status(400).json({ msg: "Campo cidade não pode estar vazio!" });
        }

        if (!state) {
            return res.status(400).json({ msg: "Campo estado não pode estar vazio!" });
        }

        if (!zip_code) {
            return res.status(400).json({ msg: "Campo CEP não pode estar vazio!" });
        }

        // Verificar se houve mudanças
        const houseEdited = {
            name,
            address,
            city,
            state,
            zip_code,
            website,
            number,
            complemento
        };

        const hasChanges = Object.keys(houseEdited).some(key => {
            const oldValue = houseVerify[key];
            const newValue = houseEdited[key];
            return String(oldValue ?? '') !== String(newValue ?? '');
        });

        // Se não houve alterações, retorna sucesso sem atualizar
        if (!hasChanges) {
            return res.json({ msg: "Local atualizado com sucesso (sem alterações)." });
        }

        // Verificar se o novo CEP já está em uso por outro local
        const cepVerify = await Local.findOne({
            where: {
                zip_code,
                house_id: { [Op.ne]: house_id }
            }
        });

        if (cepVerify) {
            return res.status(409).json({ msg: "CEP já cadastrado!" });
        }

        // Atualizar o local
        await Local.update(houseEdited, { where: { house_id } });

        return res.json({ msg: "Local atualizado com sucesso!" });

    } catch (error) {
        console.error("Erro ao editar local:", error);
        return res.status(500).json({ msg: "Erro ao editar local." });
    }
}

export async function deleteHouse(req,res){
    try {
        const house_id = req.params.id 

        // validação
        const houseVerify = await Local.findByPk(house_id)
        if(!houseVerify){
            return res.status(400).json({msg: "Id inválido"})
        }
        
        await Local.destroy({where: {house_id: house_id}})
        return res.status(200).json({msg: "Local excluida!"})   
    } catch (error) {
        console.log("Erro na rota de delete de Local => " , error)
        return res.status(500).json({msg: "Erro na rota de delete de Local => ", error})
    }
}

export async function getSearchHouse(req,res){
    const name = req.params.name 

    const resultHouses = await Local.findAll({
        where: {
            name: {
                [Op.like]: `%${name}%`
            }
        }
    })

    if(!resultHouses){
        return res.status(400).json({msg: "Nenhum local encontrado."})
    }

    return res.status(200).json(resultHouses)
}

export async function getHouseAll(req,res){
    try {
        const houses = await Local.findAll()

        if(!houses){
            return res.status(400).json({msg: "Nenhum local cadastrado"})
        }
    
        return res.status(400).json(houses)   
    } catch (error) {
        console.log("Erro na rota de get de todos locais => " , error)
        return res.status(500).json({msg: "Erro na rota de get de todos locais => ", error})
    }
}