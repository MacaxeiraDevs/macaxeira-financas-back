const jwt = require('jsonwebtoken')

function getUserId(context){
    //"Authorization": "Bearer <token_jwt>"
    const Authorization = context.request.get('Authorization')
    if(Authorization){
        const token = Authorization.replace('Bearer ', '') //Aqui, estaremos pegando somente o token, excluindo a palavra "Bearer "
        const { userId } = jwt.verify(token, process.env.JWT_SECRET) //O verify() verifica se foi mesmo a nossa API quem emitiu o token
        return userId //Dessa forma, estaremos retornando o id do usuário que é o proprietário deste token que chegou no cabeçalho da requisição
    }

    throw new Error('A requisição não está autenticada!')
}

module.exports = {
    getUserId: getUserId
}

