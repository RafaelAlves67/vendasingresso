import pagarme from 'pagarme'
import Compra from '../models/Compra.js'
import User from '../models/user.js'
import { validarCPF } from '../helpers/validarCPF.js'
import { validateEmail } from '../helpers/validateEmail.js'

export async function processarPagamento(req, res) {
  const { compra_id } = req.params
  const dados = req.body

  try {
    const compra = await buscarCompra(compra_id)
    const user = await buscarUsuario(compra.usuario_id)
    validarDadosCliente(dados)

    const client = await conectarPagarme()

    const cliente = await criarOuObterCliente(client, dados, user)
    const cartao = await criarCartao(cliente, dados)

    const order = await realizarPagamentoCartaoCredito(
        cliente.id,
        cartao.id,
        Math.round(compra.valor_total * 100),
        { descricao: 'Compra de Ingressos' },
        dados
    );


    await lidarComResultado(order, compra, res)

  } catch (error) {
    console.error('Erro no processamento de pagamento =>', error)
    return res.status(500).json({
      msg: 'Erro no processamento de pagamento.',
      error: error.response ? error.response.errors : error.message
    })
  }
}

async function buscarCompra(compra_id) {
  const compra = await Compra.findByPk(compra_id)
  if (!compra) throw new Error('Compra não encontrada!')
  if (compra.status !== 'Aguardando Pagamento') throw new Error('Status da compra inválido')
  return compra
}

async function buscarUsuario(usuario_id) {
  const user = await User.findByPk(usuario_id)
  if (!user) throw new Error('Usuário da compra não encontrado!')
  return user
}

function validarDadosCliente(dados) {
  const { cpf, email } = dados
  if (!validarCPF(cpf)) throw new Error('CPF inválido')
  if (!validateEmail(email)) throw new Error('E-mail inválido')
}

async function conectarPagarme() {
  return await pagarme.client.connect({ api_key: 'sk_f98be86d772a4dfd9b351458bd47d0d6' }) // Substitua pela real via .env
}

import fetch from 'node-fetch' // ou use axios se já estiver usando

async function criarOuObterCliente(dados, user) {
  const chaveSecreta = 'sk_test_DQ3NGmNCdiE7Me2Z'
  if (!chaveSecreta) {
    throw new Error("Chave secreta não encontrada.");
  }

  // Gera o header Authorization com a chave secreta
  const auth = 'Basic ' + Buffer.from(`${chaveSecreta}:`).toString('base64');

  const customerData = {
    external_id: `#${user.usuario_id}`,
    name: user.nameComplete,
    email: user.email,
    documents: [{ type: 'cpf', number: user.cpf }],
    type: 'individual',
    country: 'br',
    phone_numbers: [user.phone],
    birthday: user.birth
  };

  try {
    const response = await fetch('https://api.pagar.me/core/v5/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth // Insere o header Authorization com a chave secreta
      },
      body: JSON.stringify(customerData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Erro ao criar cliente:', responseData);
      throw new Error(responseData.errors?.[0]?.message || 'Erro desconhecido ao criar cliente');
    }

    return responseData;
  } catch (error) {
    console.error('Erro na requisição para criação de cliente:', error);
    throw new Error('Erro ao criar cliente na Pagar.me');
  }
}

async function criarCartao(cliente, dados) {
  const chaveSecreta = 'sk_test_DQ3NGmNCdiE7Me2Z'; // Use sua chave secreta
  if (!chaveSecreta) {
    throw new Error("Chave secreta não encontrada.");
  }

  // Gera o header Authorization com a chave secreta
  const auth = 'Basic ' + Buffer.from(`${chaveSecreta}:`).toString('base64');

  // Separar a data de expiração (MM/YY) em mês e ano
  const [exp_month, exp_year] = dados.card_expiration_date.split('/'); // Separa no formato MM/YY

  // Formatar o ano para o formato YYYY
  const full_exp_year = exp_year; // Exemplo: '33' se tornará '2033'

  // Verifique se os dados do cartão são válidos
  const cardData = {
    number: dados.card_number, // Número do cartão (somente números)
    holder_name: dados.card_holder_name, // Nome como no cartão
    holder_document: dados.holder_document, // CPF ou CNPJ, obrigatório para cartões voucher
    exp_month: exp_month, // Mês da validade
    exp_year: full_exp_year, // Ano da validade (formato yyyy preferível)
    cvv: dados.card_cvv, // Código de segurança
    brand: dados.brand, // Visa, Mastercard, etc. (opcional)
    billing_address: {
      street: dados.street,
      number: dados.street_number,
      neighborhood: dados.neighborhood,
      city: dados.city,
      state: dados.state,
      zip_code: dados.zipcode,
      country: dados.country
    },
  };

  const customerId = cliente.id; // Obtenha o customer_id do cliente criado

  try {
    const response = await fetch(`https://api.pagar.me/core/v5/customers/${customerId}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth // Insere o header Authorization com a chave secreta
      },
      body: JSON.stringify(cardData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Erro ao criar cartão:', responseData);
      throw new Error(responseData.errors?.[0]?.message || 'Erro desconhecido ao criar cartão');
    }

    return responseData;
  } catch (e) {
    console.error('Erro na requisição para criação de cartão:', e);
    throw new Error('Erro ao criar cartão na Pagar.me');
  }
}

async function realizarPagamentoCartaoCredito(customer_id, card_id, valor_centavos, itemInfo, dados) {
  const chaveSecreta = 'sk_test_DQ3NGmNCdiE7Me2Z'; // Use sua chave secreta
  if (!chaveSecreta) {
    throw new Error("Chave secreta não encontrada.");
  }

  // Gera o header Authorization com a chave secreta
  const auth = 'Basic ' + Buffer.from(`${chaveSecreta}:`).toString('base64');

  const [exp_month_str, exp_year_str] = dados.card_expiration_date.split('/');
  const exp_month = parseInt(exp_month_str, 10); // Ex: '01' => 1
  const exp_year = parseInt(exp_year_str, 10);

  // Monta os dados da ordem
  const orderData = {
    items: [{
      amount: valor_centavos,
      description: itemInfo.descricao,
      quantity: 1,
      code: "Ingresso_001"
    }],
    customer: {
      name: dados.nameComplete,
      email: dados.email,
      type: 'individual',
      document: dados.cpf,
      phones: {
        mobile_phone: {
          country_code: "55",     // Brasil
          area_code: "11",        // DDD
          number: "912345678"     // Número de celular (sem o 9 adicional de alguns estados)
        }
      },
    },
    payments: [{
      payment_method: 'credit_card',
      credit_card: {
        recurrence_cycle: 'first',
        installments: 1,
        statement_descriptor: 'AVENGERS',
        card: {
          number: dados.card_number,
          holder_name: dados.card_holder_name,
          exp_month: exp_month,
          exp_year: exp_year,
          cvv: dados.card_cvv,
          billing_address: {
            line_1: `${dados.street}, ${dados.street_number}, ${dados.neighborhood}`,
            zip_code: dados.zipcode,
            city: dados.city,
            state: dados.state,
            country: dados.country
          }
        }
      }
    }]
  };

  try {
    const response = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth
      },
      body: JSON.stringify(orderData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Erro ao criar ordem de pagamento:', responseData);
      throw new Error(responseData.errors?.[0]?.message || 'Erro desconhecido ao criar ordem');
    }

    return responseData;
  } catch (e) {
    console.error('Erro na requisição para criação da ordem:', e);
    throw new Error('Erro ao realizar pagamento com cartão de crédito na Pagar.me');
  }
}

async function lidarComResultado(order, compra, res) {
  const charge = order.charges?.[0];

  if (charge?.status === 'paid') {
    compra.status = 'Aprovada';
    compra.transaction_id = charge.id;
    await compra.save();

    return res.status(200).json({
      msg: 'Pagamento aprovado!',
      order
    });
  } else {
    // Log de motivo de recusa
    console.error('Pagamento recusado. Detalhes:');
    console.error('Status:', charge?.status);
    console.error('Status Reason:', charge?.status_reason);
    console.error('Mensagem da Transação:', charge?.last_transaction?.message);
    console.error('Código da Transação:', charge?.last_transaction?.acquirer_response_code);
    console.error('Nome do Emissor:', charge?.last_transaction?.acquirer_name);
    console.error('Resposta do Emissor:', charge?.last_transaction?.acquirer_message);

    return res.status(402).json({
      msg: 'Pagamento recusado.',
      status: charge?.status || 'desconhecido',
      reason: charge?.status_reason || 'motivo não especificado',
      acquirer_message: charge?.last_transaction?.acquirer_message || 'mensagem não informada',
      order
    });
  }
}
