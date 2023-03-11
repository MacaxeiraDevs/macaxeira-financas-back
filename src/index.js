const { GraphQLServer } = require('graphql-yoga')
const Binding = require('prisma-binding')
const { prisma } = require('./generated/prisma-client')

/* Criando a resolver */
const resolvers = require('./resolvers/index')

let env = process.env
let endpoint = `${env.PRISMA_ENDPOINT}/${env.PRISMA_SERVICE}/${env.PRISMA_STAGE}`

/* Criando o servidor do GraphQL Yoga */
const servidor = new GraphQLServer({
    typeDefs: `${__dirname}/schema.graphql`,
    resolvers: resolvers,
    context: request => ({
        ...request,
        /* Instanciando o pacote Prisma Binding. Com ele, nós podemos realizar consultas específicas e quando isso acontecer, será retornado somente os valores que pedimos. Além disso, ao instanciar pelo argumento "context", ele ficará disponível para todos os resolvers, basta passar para o terceiro argumento "context" dos métodos de queries, mutations, etc, essa configuração */
        db: new Binding.Prisma({
            typeDefs: `${__dirname}/generated/graphql-schema/prisma.graphql`,
            endpoint: endpoint
        }),
        prisma
    })
})

servidor.start().then(() => console.log('Servidor rodando em http://localhost:4000...')) //4000 é a porta padrão que o GraphQL Yoga utiliza


