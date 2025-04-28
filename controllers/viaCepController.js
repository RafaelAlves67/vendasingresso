import axios from 'axios';

// Função para buscar o endereço por CEP
export const buscarEnderecoPorCep = async (req, res) => {
    const { cep } = req.params;

    // Validando o formato do CEP
    if (!/^\d{5}-?\d{3}$/.test(cep)) {
        return res.status(400).json({ error: 'CEP inválido' });
    }

    try {
        // Fazendo a requisição para a API ViaCEP
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

        // Verificando se houve erro no retorno da API
        if (response.data.erro) {
            return res.status(404).json({ error: 'CEP não encontrado' });
        }

        // Retornando os dados do endereço
        return res.json(response.data);
    } catch (error) {
        console.error('Erro ao buscar o endereço:', error.message);
        return res.status(500).json({ error: 'Erro ao buscar o endereço' });
    }
};
