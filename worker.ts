import 'dotenv/config'
import { startImageWorker } from './src/workers/imageWorker'
import { startZipWorker } from './src/workers/zipWorker'
import { startNotificationWorker } from './src/workers/notificationWorker'

startImageWorker()
startZipWorker()
startNotificationWorker()
