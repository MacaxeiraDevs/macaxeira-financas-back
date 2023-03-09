const { GraphQLServer } = require('graphql-yoga')
const Binding = require('prisma-binding')
const { prisma } = require('./generated/prisma-client')

/* Criando um novo usuário, listando usuários. O procedimento de consulta a esses dados do usuário é feito pelo Playground "localhost:4466"
async function main(){
    //Criando um novo usuário
    await prisma.createUser({
        name: 'Rafael Yokouchi',
        email: 'rafayokouchi@gmail.com',
        password: '123456'
    })

    //Listando/buscando usuários
    const users = await prisma.users()
    console.log('Usuários: ',  users)
}

main().catch(e => console.error(e))

Porém não é recomendado utilizar o Playground para de fato permitir as consultas, pois esse tipo de recurso fica exposto para qualquer client que tiver acesso ao Playground */

/* Criando a resolver */
const resolvers = require('./resolvers/index')

const env = process.env
const endpoint = `${env.PRISMA_ENDPOINT}/${env.PRISMA_SERVICE}/${env.PRISMA_STAGE}`

/* Criando o servidor do GraphQL Yoga */
const server = new GraphQLServer({
    typeDefs: `${__dirname}/schema.graphql`,
    resolvers: resolvers,
    context: (request) => ({
        ...request,
        /* Instanciando o pacote Prisma Binding. Com ele, nós podemos realizar consultas específicas e quando isso acontecer, será retornado somente os valores que pedimos. Além disso, ao instanciar pelo argumento "context", ele ficará disponível para todos os resolvers, basta passar para o terceiro argumento "context" dos métodos de queries, mutations, etc, essa configuração */
        db: new Binding.Prisma({
            typeDefs: `${__dirname}/generated/graphql-schema/prisma.graphql`,
            endpoint: endpoint
        }),
        prisma: prisma
    })
})

server.start().then(() => console.log('Servidor rodando em http://localhost:4000...')) //4000 é a porta padrão que o GraphQL Yoga utiliza


