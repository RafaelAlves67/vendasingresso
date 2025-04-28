import nodemailer from 'nodemailer';

export const enviarFormulario = async (req, res) => {
    const { nome, email, mensagem } = req.body;

    try {
        // Transportador (aqui usamos o Gmail como exemplo)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'centraltiket19@gmail.com', // troque para seu e-mail
                pass: 'lnge upaj xkvy ffya'
            }
        });

        // Conteúdo do e-mail
        const mailOptions = {
            from: email,
            to: 'loganodaguiri@outlook.com',
            subject: `Nova mensagem de ${nome}`,
            text: `Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Mensagem enviada com sucesso!' });

    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        res.status(500).json({ message: 'Erro ao enviar mensagem.' });
    }
};
