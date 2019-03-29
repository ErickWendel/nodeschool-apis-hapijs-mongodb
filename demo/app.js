const Hapi = require('hapi')
const Joi = require('joi')
const {MongoClient, ObjectID} = require('mongodb')
const connectionString = "mongodb://nodeschool:nodeschool123@cluster0-shard-00-00-rwlhl.mongodb.net:27017,cluster0-shard-00-01-rwlhl.mongodb.net:27017,cluster0-shard-00-02-rwlhl.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true"
async function connectAndGetCollection() {
    const connection = await MongoClient.connect(connectionString, { useNewUrlParser: true})
    const collection = await connection.db('erick').collection('heroes')
    return collection
}

const app = new Hapi.Server({
    port: 3000
})

const defaultValidation = {
    failAction(req, headers, error) {
        throw error
    }
}
async function main() {
    const db = await connectAndGetCollection();
    // const db = [];
    //define routes
    app.route([{
            method: 'GET',
            path: '/heroes',
            config: {
                validate: {
                    query: {
                        skip: Joi.number().default(0),
                        limit: Joi.number().default(2)
                    },
                    ...defaultValidation
                }
            },
            async handler(req) {
                const { skip, limit} = req.query
                // return db.slice(skip, limit)
                return db.find({}).limit(limit).skip(skip).toArray()
            }
        },
        {
            method: 'POST',
            path: '/heroes',
            config: {
                validate: {
                    payload: {
                        name: Joi.string().required(),
                        power: Joi.string().required(),
                        age: Joi.number().required()
                    },
                    // show errors to the client
                    ...defaultValidation
                },
            },
            async handler(req) {
                const data = req.payload
                // db.push({
                //     _id: Date.now(),
                //     ...data
                // })
                await db.insertOne(data)
                return true;
            }
        },
        {
            method: 'PATCH',
            path: '/heroes/{id}',
            config: {
                validate: {
                    ...defaultValidation,
                    payload: {
                        name: Joi.string(),
                        power: Joi.string(),
                        age: Joi.number()
                    },
                    params: {
                        id: Joi.string().required()
                    }
                }
            },
            async handler (req) {
                try {
                    const _id = ObjectID(req.params.id)
                    const data = req.payload
                    const r = await db.updateOne({
                        _id: _id
                    }, {
                        $set: data
                    })
                    return r;
                } catch (error) {
                    console.log('error', error)
                    throw error
                }
            }
        },
        {
            method: 'DELETE',
            path: '/heroes/{id}',
            config: {
                validate: {
                    ...defaultValidation,
                    params: {
                        id: Joi.string().required()
                    }
                }
            },
            async handler (req) {
                return db.deleteOne({_id: ObjectID(req.params.id)})
            },

        }
    ])
    await app.start()
    console.log('app running at', app.info.port)
}
main()