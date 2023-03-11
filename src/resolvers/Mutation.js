const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const moment = require('moment')
const { getUsuarioId } = require('./../utils')

const JWT_SECRET = process.env.JWT_SECRET

//Mutation para criação de categorias
function createCategoria(_, { descricao, tipo }, ctx, info){
    const usuarioId = getUsuarioId(ctx)
    return ctx.db.mutation.createCategoria({
        data: {
            descricao,
            tipo,
            usuario: {
                connect: {
                    id: usuarioId
                }
            }
        }
    }, info)
}

//Mutation de criação de lançamentos
function createLancamento(_, args, ctx, info){
    //Validando data através do Moment JS
    const data = moment(args.data)
    if(!data.isValid()){
        throw new Error('Data inválida!')
    }

    let { valor, tipo } = args
    if(
        (tipo === 'DESPESA' && valor > 0) //valor = 50 => -50 (+ com - = -)
        || (tipo === 'RECEITA' && valor < 0)){  //valor = -50 => 50 (- com - = +)
            valor = -valor
    }

    const usuarioId = getUsuarioId(ctx)
    return ctx.db.mutation.createLancamento({
        data: {
            usuario: {
                connect: {
                    id: usuarioId
                }
            },
            categoria: {
                connect: {
                    id: args.categoriaId 
                }
            },
            valor,
            tipo,
            data: { set: args.data },
            descricao: args.descricao
        }
    }, info)
}

//Mutation de login
async function login(_, { email, senha }, ctx, info){
    //Verificando se o e-mail é válido
    const usuario = await ctx.db.query.usuario({ where: { email }})
    if(!usuario){
        throw new Error('Credenciais inválidas!')
    }

    //Verificando se a senha é válida
    const valido = await bcrypt.compare(senha, usuario.senha) //O método compare() irá comparar uma senha com outra
    if(!valido){
        throw new Error('Credenciais inválidas')
    }

    const token = jwt.sign({ usuarioId: usuario.id }, JWT_SECRET, { expiresIn: '2h' })

    return {
        token,
        usuario
    }
}

//Mutation de cadastro
async function registrar(_, args, ctx, info){
    const senha = await bcrypt.hash(args.senha, 10) //Esse método retorna uma promise, por isso utilizamos async e await
    const usuario = await ctx.db.mutation.createUsuario({ data: { ...args, senha } }) //Spread //Como a senha no spread do argumento original não está criptografado, então passamos a const "senha" que contém a criptografia
    
    const token = jwt.sign({ usuarioId: usuario.id }, JWT_SECRET, { expiresIn: '2h' })

    return {
        token,
        usuario
    }
}

module.exports = {
    createCategoria,
    createLancamento,
    login,
    registrar
}