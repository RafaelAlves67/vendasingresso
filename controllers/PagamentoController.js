import pagarme from 'pagarme' 
import Compra from '../models/Compra.js'
import User from '../models/user.js'
import { validarCPF } from '../helpers/validarCPF.js'
import {validateEmail} from '../helpers/validateEmail.js'
import {parse, format, isBefore} from 'date-fns'

export async function processarPagamento(req, res) {
  const { compra_id } = req.params
  const {
    nameComplete,
    email,
    phone,
    birth,
    cpf,
    card_number,
    card_cvv,
    card_expiration_date,
    card_holder_name,
    method,
    country, 
    state, 
    city, 
    neighborhood, 
    street, 
    street_number, 
    zipcode, 
  } = req.body

  try {
    // 1. Buscar a compra
    const compra = await Compra.findByPk(compra_id)
    if (!compra) {
      return res.status(404).json({ msg: 'Compra não encontrada!' })
    }

    if(compra.status !== 'Aguardando Pagamento'){
        return res.status(403).json({msg: "Status da compra inválido"})
    }

    // 2. Buscar o usuário
    const user = await User.findByPk(compra.usuario_id)
    if (!user) {
      return res.status(404).json({ msg: 'Usuário da compra não encontrado!' })
    }

    // Validar CPF
    const cpfLimpo = cpf.replace(/\D/g, '');
    if(!validarCPF(cpfLimpo)){
      return res.status(400).json({msg: "CPF inválido"})
    }

    // validar Email 
    if(!validateEmail(email)){
      return res.status(400).json({msg: "E-mail inválido"})
    }

    // validar numero de celular
    if(!/^\+55\d{11}$/.test(phone)) {
      return res.status(400).json({ msg: "Número de celular inválido. Formato esperado: +5511999999999" });
    }

    // validar data de nascimento
    const dataNascimento = parse(birth, 'yyyy-MM-dd', new Date());
   const dataAtual = new Date();
    if(!isBefore(dataNascimento, dataAtual)){
      return res.status(400).json({msg: "Data de nascimento inválida"})
    }

    // 3. Conectar com Pagar.me
    const client = await pagarme.client.connect({ api_key: 'SUA_API_KEY' })



    // 4. Criar a transação
    
    // verificar os metodos

    // SE FOR PAGAMENTO VIA PIX
    if(method === 'pix'){
      const transaction = await client.transactions.create({
        amount: parseInt(compra.valor_total * 100), // em centavos
        payment_method: 'pix',
        customer: {
          external_id: `#${user.usuario_id}`,
          name: nameComplete,
          type: 'individual',
          country: 'br',
          email,
          documents: [
            {
              type: 'cpf',
              number: cpf
            }
          ],
          phone_numbers: [phone],
          birthday: birth
        },
        billing: {
          name: nameComplete,
          address: {
            country,
            state,
            city,
            neighborhood,
            street,
            street_number,
            zipcode
          }
        },
        items: [
          {
            id: `${compra.compra_id}`,
            title: 'Compra de Ingressos',
            unit_price: parseInt(compra.valor_total * 100),
            quantity: 1,
            tangible: false
          }
        ]
      });

      compra.transaction_id = transaction.id;
      await compra.save();

      return res.status(200).json({
        msg: 'Transação criada. Aguardando pagamento via PIX.',
        status: transaction.status, // deve ser 'waiting_payment'
        transaction_id: transaction.id,
        pix_qr_code_url: transaction.pix_qr_code_url,
        pix_expiration_date: transaction.pix_expiration_date
      })

    // SE FOR PAGAMENTO VIA CARTAO DE CREDITO
    }else{
       const transaction = await client.transactions.create({
        amount: parseInt(compra.valor_total * 100), // em centavos
        payment_method: 'credit_card',
        card_number,
        card_cvv,
        card_expiration_date,
        card_holder_name,
        customer: {
          external_id: `#${user.usuario_id}`,
          name: nameComplete,
          type: 'individual',
          country: 'br',
          email: email,
          documents: [
            {
              type: 'cpf',
              number: cpf 
            }
          ],
          phone_numbers: [phone],
          birthday: birth
        },
        billing: {
          name: card_holder_name,
          address: {
            country: country,
            state: state,
            city: city,
            neighborhood: neighborhood,
            street: street,
            street_number: street_number,
            zipcode: zipcode
          }
        },
        items: [
          {
            id: `${compra.compra_id}`,
            title: 'Compra de Ingressos',
            unit_price: parseInt(compra.valor_total * 100),
            quantity: 1,
            tangible: false
          }
        ],
        metadata: {
          compra_id: compra.compra_id
        }
      })

      // 5. Verificar status da transação
    if (transaction.status === 'paid') {
      
      // Você pode atualizar a compra como "paga" se quiser
       compra.status = 'Aprovada'
       compra.transaction_id = transaction.id
       await compra.save()

      return res.status(200).json({
        msg: 'Pagamento aprovado!',
        transaction
      })
    } else {
      return res.status(402).json({
        msg: 'Pagamento recusado.',
        status: transaction.status,
        transaction
      })
    }
  
    }
  } catch (error) {
    console.error('Erro no processamento de pagamento =>', error)
    return res.status(500).json({
      msg: 'Erro no processamento de pagamento.',
      error: error.response ? error.response.errors : error.message
    })
  }
}
