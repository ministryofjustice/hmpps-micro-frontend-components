const path = require('node:path')
const { styleText } = require('node:util')
const swaggerJSDoc = require('swagger-jsdoc')
const { emojis } = require('./utils')

const routesDir = path.join(__dirname, '../server/routes')
const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Frontend Components API',
      version: '1.0.0',
      description: 'API for accessing shared frontend components for use in DPS applications',
    },
    servers: [
      {
        url: 'frontend-components-dev.hmpps.service.justice.gov.uk',
      },
      {
        url: 'frontend-components-preprod.hmpps.service.justice.gov.uk',
      },
      {
        url: 'frontend-components.hmpps.service.justice.gov.uk',
      },
    ],
  },
  apis: [path.join(routesDir, 'componentRoutes.ts')],
}

function swaggerJSDocsPlugin() {
  let specJson = null

  return {
    name: 'swagger-jsdocs',
    setup(build) {
      build.onStart(() => {
        process.stderr.write(`${styleText('bold', `${emojis.cyclone} Building OpenAPI spec...`)}\n`)
        const spec = swaggerJSDoc(options)
        specJson = JSON.stringify(spec)
      })

      build.onLoad({ filter: /openApiSpec\.json$/ }, () => {
        return { contents: specJson, loader: 'json' }
      })
    },
  }
}

module.exports = { swaggerJSDocsPlugin }
