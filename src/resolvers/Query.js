const { getUsuarioId } = require('./../utils')
const moment = require('moment')

function categorias(_, { tipo }, ctx, info){
    const usuarioId = getUsuarioId(ctx)

    let AND = [
        {
            OR: [
                {
                    usuario: {
                        id: usuarioId
                    }
                },
                {
                    usuario: null
                }
            ]
        }
    ]

    AND = !tipo ? AND : [ ...AND, { tipo: tipo } ] //Como o argumento de tipo não é obrigatório, então essa lógica precisa ser feita para que a consulta permita trazer com e sem o argumento "tipo"

    return ctx.db.query.categorias({
        where: { AND },
        orderBy: 'descricao_ASC'
    }, info)
}

function lancamentos(_, { mes, tipo, categoriasIds }, ctx, info){
    const usuarioId = getUsuarioId(ctx)
    let AND = [
        { usuario: { id: usuarioId } }
    ]

    //Buscando lançamentos em um intervalo de datas
    if(mes){
        const data = moment(mes, 'MM-YYYY') //Exemplo: 06-2019
        const inicioData = data.startOf('month').toISOString()
        const fimData = data.endOf('month').toISOString()

        AND = [
            ...AND,
            { date_gte: inicioData },
            { date_lte: fimData }
        ]
    }

    return ctx.db.query.lancamentos({
        where: { AND },
        orderBy: 'data_ASC'
    }, info)
}

function balancoTotal(_, { data }, ctx, info){
    const usuarioId = getUsuarioId(ctx)
    const dataISO = moment(data, 'YYYY-MM-DD').endOf('day').toISOString()
    const pgSchema = `${process.env.PRISMA_SERVICE}$${process.env.PRISMA_STAGE}`

    const mutation = `
        mutation BalancoTotal($database: PrismaDatabase, $query: String!) {
            executeRaw(database: $database, query: $query)
        }
    `

    const variables = {
        database: 'default',
        query: `
            select 
                sum("${pgSchema}"."Lancamento"."valor") as balancototal
            from 
                "${pgSchema}"."Lancamento"
            inner join "${pgSchema}"."_LancamentoToUsuario"
            on("${pgSchema}"."_LancamentoToUsuario"."A" = "${pgSchema}"."Lancamento"."id")
            where "${pgSchema}"."_LancamentoToUsuario"."B" = '${usuarioId}'
            and "${pgSchema}"."Lancamento"."data" <= '${dataISO}';
        `
    }

    return ctx.prisma.$graphql(mutation, variables)
        .then(response => {
            const balancoTotal = response.executeRaw[0].balancototal
            return balancoTotal ? balancoTotal : 0
        })
}

function usuario(_, args, ctx, info){
    const usuarioId = getUsuarioId(ctx)
    return ctx.db.query.usuario({ where: { id: usuarioId }}, info)
}

module.exports = {
    categorias,
    lancamentos,
    balancoTotal,
    usuario
}



