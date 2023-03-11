const jwt = require('jsonwebtoken')

function getUsuarioId(ctx){
    //"Authorization": "Bearer <token_jwt>"
    const Autorizacao = ctx.request.get('Authorization')
    if(Autorizacao){
        const token = Autorizacao.replace('Bearer ', '') //Aqui, estaremos pegando somente o token, excluindo a palavra "Bearer "
        const { usuarioId } = jwt.verify(token, process.env.JWT_SECRET) //O verify() verifica se foi mesmo a nossa API quem emitiu o token
        return usuarioId //Dessa forma, estaremos retornando o id do usuário que é o proprietário deste token que chegou no cabeçalho da requisição
    }

    throw new Error('A requisição não está autenticada!')
}

module.exports = {
    getUsuarioId
}

