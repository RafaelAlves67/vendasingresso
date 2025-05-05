export async function criarClienteSeNaoExistir(cpf) {
    const transaction = await sequelize.transaction();

    try {
        const usuarioExterno = await UsuarioExterno.findOne({
            where: { cpf },
            transaction
        });

        if (!usuarioExterno) {
            throw new Error('Usu�rio n�o encontrado com esse CPF');
        }

        await cartaoCreditoService.criarClienteSeNaoExistir(usuarioExterno, transaction);

        await usuarioExterno.save({ transaction });

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw new Error(`Erro ao criar cliente: ${err.message}`);
    }
}