import Producer from '../models/Produtor.js';

// REGISTRAR PRODUTOR
export async function registerProducer(req, res) {
    try {
        const { name, description, usuario_id } = req.body;

        if (!name) return res.status(400).json({ msg: "Insira o nome do produtor!" });
        if (!usuario_id) return res.status(400).json({ msg: "Informe o ID do usuário associado!" });

        const newProducer = await Producer.create({
            name,
            description,
            usuario_id
        });

        return res.status(201).json({
            msg: "Produtor registrado com sucesso!",
            produtor_id: newProducer.produtor_id
        });

    } catch (error) {
        console.log("Erro na rota de cadastro de produtor =>", error);
        return res.status(500).json({ msg: "Erro interno no servidor", error });
    }
}

// EDITAR PRODUTOR
export async function editProducer(req, res) {
    try {
        const { produtor_id, name, description } = req.body;

        // Verifica se os campos obrigatórios estão presentes
        if (!produtor_id) return res.status(400).json({ msg: "Informe o ID do produtor!" });
        if (!name) return res.status(400).json({ msg: "O nome do produtor é obrigatório!" });

        // Verifica se o produtor existe no banco
        const producer = await Producer.findByPk(produtor_id);

        if (!producer) {
            return res.status(404).json({ msg: "Produtor não encontrado!" });
        }

        // Atualiza as informações do produtor
        producer.name = name;
        producer.description = description;

        // Salva as alterações no banco
        await producer.save();

        // Retorna a resposta de sucesso
        return res.status(200).json({
            msg: "Produtor atualizado com sucesso!",
            produtor_id: producer.produtor_id // Confirme o nome da chave ID no seu modelo
        });
    } catch (error) {
        console.log("Erro ao editar produtor =>", error);
        return res.status(500).json({ msg: "Erro interno no servidor", error });
    }
}
