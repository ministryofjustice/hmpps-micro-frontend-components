import bunyan from 'bunyan'
import bunyanFormat from 'bunyan-format'
import config from './server/config'

const formatOut = bunyanFormat({ outputMode: 'short', color: !config.production })

const logger = bunyan.createLogger({ name: 'Frontend Components', stream: formatOut, level: 'debug' })

export const warnLevelLogger = bunyan.createLogger({
  name: 'Frontend Components',
  stream: formatOut,
  level: 'warn',
})

export default logger
