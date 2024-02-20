import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import path from 'path'

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Frontend Components API',
      version: '1.0.0',
      description: 'API for accessing shared frontend components for use in dps applications',
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
  apis: [path.join(__dirname, '../routes/componentRoutes.js')],
}
export default function setUpSwagger(app: express.Express) {
  const specs = swaggerJsdoc(options)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))
}
