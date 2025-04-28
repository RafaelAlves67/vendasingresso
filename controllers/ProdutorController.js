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
