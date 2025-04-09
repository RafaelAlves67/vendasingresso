import Compra from "../models/Compra.js";

export async function webhookPagamento(req, res) {
    const { current_status, id, metadata } = req.body;
  
    try {
      const compra_id = metadata?.compra_id;
      const compra = await Compra.findByPk(compra_id);
      if (!compra) {return res.status(404).json({msg: "id de compra inválido"})}
  
      if (current_status === 'paid') {
        compra.status = 'Aprovada';
        await compra.save();
      }
  
      res.sendStatus(200);
    } catch (error) {
      console.error('Erro no webhook:', error);
      res.sendStatus(500);
    }
  }
  