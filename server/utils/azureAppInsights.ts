import {
  Contracts,
  defaultClient,
  DistributedTracingModes,
  getCorrelationContext,
  setup,
  TelemetryClient,
} from 'applicationinsights'
import { EnvelopeTelemetry } from 'applicationinsights/out/Declarations/Contracts'
import { RequestHandler } from 'express'
import { ApplicationInfo } from '../applicationInfo'

const requestPrefixesToIgnore = ['GET /assets/', 'GET /health', 'GET /ping', 'GET /info']
const dependencyPrefixesToIgnore = ['sqs']

export type ContextObject = {
  [name: string]: any
}

export function initialiseAppInsights(): void {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')

    setup().setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C).start()
  }
}

export function buildAppInsightsClient(applicationInfo: ApplicationInfo): TelemetryClient {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    defaultClient.context.tags['ai.cloud.role'] = applicationInfo.applicationName
    defaultClient.context.tags['ai.application.ver'] = applicationInfo.buildNumber
    defaultClient.addTelemetryProcessor(addUserDataToRequests)
    defaultClient.addTelemetryProcessor(parameterisePaths)
    defaultClient.addTelemetryProcessor(ignoredRequestsProcessor)
    defaultClient.addTelemetryProcessor(ignoredDependenciesProcessor)
    return defaultClient
  }
  return null
}

function addUserDataToRequests(envelope: EnvelopeTelemetry, contextObjects: ContextObject) {
  const isRequest = envelope.data.baseType === Contracts.TelemetryTypeString.Request
  if (isRequest) {
    const { username, activeCaseLoadId } = contextObjects?.['http.ServerRequest']?.res?.locals?.user || {}
    if (username) {
      const { properties } = envelope.data.baseData
      // eslint-disable-next-line no-param-reassign
      envelope.data.baseData.properties = {
        username,
        activeCaseLoadId,
        ...properties,
      }
    }
  }
  return true
}

function parameterisePaths(envelope: EnvelopeTelemetry, contextObjects: ContextObject) {
  const operationNameOverride = contextObjects.correlationContext?.customProperties?.getProperty('operationName')
  if (operationNameOverride) {
    envelope.tags['ai.operation.name'] = envelope.data.baseData.name = operationNameOverride // eslint-disable-line no-param-reassign,no-multi-assign
  }
  return true
}

function ignoredRequestsProcessor(envelope: EnvelopeTelemetry) {
  if (envelope.data.baseType === Contracts.TelemetryTypeString.Request) {
    const requestData = envelope.data.baseData
    if (requestData instanceof Contracts.RequestData) {
      const { name } = requestData
      return requestPrefixesToIgnore.every(prefix => !name.startsWith(prefix))
    }
  }
  return true
}

function ignoredDependenciesProcessor(envelope: EnvelopeTelemetry) {
  if (envelope.data.baseType === Contracts.TelemetryTypeString.Dependency) {
    const dependencyData = envelope.data.baseData
    if (dependencyData instanceof Contracts.RemoteDependencyData) {
      const { target } = dependencyData
      return dependencyPrefixesToIgnore.every(prefix => !target.startsWith(prefix))
    }
  }
  return true
}

export function appInsightsMiddleware(): RequestHandler {
  return (req, res, next) => {
    res.prependOnceListener('finish', () => {
      const context = getCorrelationContext()
      if (context && req.route) {
        context.customProperties.setProperty('operationName', `${req.method} ${req.route?.path}`)
      }
    })
    next()
  }
}
