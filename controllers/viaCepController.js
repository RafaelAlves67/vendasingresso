import axios from 'axios';

// Fun��o para buscar o endere�o por CEP
export const buscarEnderecoPorCep = async (req, res) => {
    const { cep } = req.params;

    // Validando o formato do CEP
    if (!/^\d{5}-?\d{3}$/.test(cep)) {
        return res.status(400).json({ error: 'CEP inv�lido' });
    }

    try {
        // Fazendo a requisi��o para a API ViaCEP
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

        // Verificando se houve erro no retorno da API
        if (response.data.erro) {
            return res.status(404).json({ error: 'CEP n�o encontrado' });
        }

        // Retornando os dados do endere�o
        return res.json(response.data);
    } catch (error) {
        console.error('Erro ao buscar o endere�o:', error.message);
        return res.status(500).json({ error: 'Erro ao buscar o endere�o' });
    }
};
