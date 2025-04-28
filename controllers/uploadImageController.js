import axios from 'axios';
import fs from 'fs';

// Função para converter o arquivo para base64
const convertToBase64 = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'base64', (err, data) => {
            if (err) {
                return reject('Erro ao ler o arquivo para conversão');
            }
            resolve(data); // Retorna o arquivo em base64
        });
    });
};

export const uploadImageToExternalApi = async (file) => {
    try {
        if (!file || !file.path) {
            throw new Error('Arquivo não enviado ou inválido');
        }

        // Converte o arquivo para base64
        const base64Image = await convertToBase64(file.path);

        // Substitua 'YOUR_API_KEY' pela sua chave de API do ImgBB
        const apiKey = '7edae5e2ea39073ab6f0f363444b9e18';
        const url = `https://api.imgbb.com/1/upload?key=${apiKey}`;

        const formData = new FormData();
        formData.append('image', base64Image); // Envia o base64 para o ImgBB

        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.data.success) {
            return response.data.data.url; // Retorna a URL da imagem
        }

        throw new Error('Erro ao fazer o upload da imagem');
    } catch (error) {
        console.error('Erro ao fazer o upload da imagem:', error.message);
        throw new Error(`Erro ao fazer o upload da imagem: ${error.message}`);
    }
};
