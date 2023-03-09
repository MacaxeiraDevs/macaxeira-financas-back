const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const moment = require('moment')
const { getUserId } = require('./../utils')

const JWT_SECRET = process.env.JWT_SECRET

//Mutation de criação de conta (Dinheiro ou Débito, etc)
function createAccount(_, { description }, ctx, info){
    const userId = getUserId(ctx)
    return ctx.db.mutation.createAccount({
        data: {
            description: description,
            user: {
                connect: {
                    id: userId
                }
            }
        }
    }, info)
}

//Mutation para criação de categorias
function createCategory(_, { description, operation }, ctx, info){
    const userId = getUserId(ctx)
    return ctx.db.mutation.createCategory({
        data: {
            description: description,
            operation: operation,
            user: {
                connect: {
                    id: userId
                }
            }
        }
    }, info)
}

//Mutation de criação de lançamentos
function createRecord(_, args, ctx, info){
    //Validando data através do Moment JS
    const date = moment(args.date)
    if(!date.isValid()){
        throw new Error('Data inválida!')
    }

    let { amount, type } = args
    if(
        (type === 'DEBIT' && amount > 0) //amount = 50 => -50 (+ com - = -)
        || (type === 'CREDIT' && amount < 0)){  //amount = -50 => 50 (- com - = +)
            amount = -amount
    }

    const userId = getUserId(ctx)
    return ctx.db.mutation.createRecord({
        data: {
            user: {
                connect: {
                    id: userId
                }
            },
            account: {
                connect: {
                    id: args.accountId
                }
            },
            category: {
                connect: {
                    id: args.categoryId
                }
            },
            amount,
            type,
            date: args.date,
            description: args.description,
            tags: args.tags,
            note: args.note
        }
    }, info)
}

//Mutation de login
async function login(_, { email, password }, ctx, info){
    //Verificando se o e-mail é válido
    const user = await ctx.db.query.user({ where: { email }})
    if(!user){
        throw new Error('Credenciais inválidas!')
    }

    //Verificando se a senha é válida
    const valid = await bcrypt.compare(password, user.password) //O método compare() irá comparar uma senha com outra
    if(!valid){
        throw new Error('Credenciais inválidas')
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '2h' })

    return {
        token: token,
        user: user
    }
}

//Mutation de cadastro
async function signup(_, args, ctx, info){
    const password = await bcrypt.hash(args.password, 10) //Esse método retorna uma promise, por isso utilizamos async e await
    const user = await ctx.db.mutation.createUser({ data: { ...args, password } }) //Spread //Como o password no spread do argumento original não está criptografado, então passamos a const "password" que contém a criptografia
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '2h' })

    return {
        token: token,
        user: user
    }
}

module.exports = {
    createAccount: createAccount,
    createCategory: createCategory,
    createRecord: createRecord,
    login: login,
    signup: signup
}