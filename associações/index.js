import Event from '../models/event.js'
import Ingresso from '../models/Ingresso.js';
import Lote from '../models/Lote.js';
import Compra from '../models/Compra.js';
import ItemCompra from '../models/ItemCompra.js';
import User from '../models/user.js';
import showHouse from '../models/Local.js';
import Produtor from '../models/Produtor.js';

export default function setupAssociations() {

  Event.hasMany(Ingresso, { foreignKey: 'evento_id' });
  Ingresso.belongsTo(Event, { foreignKey: 'evento_id' });

  Ingresso.hasMany(Lote, { foreignKey: 'ingresso_id' });
  Lote.belongsTo(Ingresso, { foreignKey: 'ingresso_id' });

  User.hasMany(Compra, { foreignKey: 'usuario_id' });
  Compra.belongsTo(User, { foreignKey: 'usuario_id' });

  Compra.hasMany(ItemCompra, { foreignKey: 'compra_id' });
  ItemCompra.belongsTo(Compra, { foreignKey: 'compra_id' });

  ItemCompra.belongsTo(Ingresso, { foreignKey: 'ingresso_id' });
  Ingresso.hasMany(ItemCompra, { foreignKey: 'ingresso_id' });

  
  Event.belongsTo(showHouse, {
    foreignKey: 'house_id', // Chave estrangeira no Evento
    as: 'local',            // Alias para o relacionamento
  });
  showHouse.hasMany(Event, {
    foreignKey: 'house_id', // Chave estrangeira no Evento
    as: 'eventos',          // Alias para o relacionamento
  });

  Produtor.hasMany(Event, {
    foreignKey: 'produtor_id', // Chave estrangeira do produtor
    as: 'eventos',             // Alias para o relacionamento
  });
  Event.belongsTo(Produtor, {
    foreignKey: 'produtor_id', // Chave estrangeira do produtor
    as: 'produtor',            // Alias para o relacionamento
  });

  Produtor.belongsTo(User, {
    foreignKey: 'usuario_id', // Chave estrangeira do usuário
    as: 'user',            // Alias para o relacionamento
  });
  User.hasMany(Produtor, {
    foreignKey: 'usuario_id', // Chave estrangeira do usuario
    as: 'user',          // Alias para o relacionamento
  });


}
