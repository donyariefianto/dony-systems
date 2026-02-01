import type { ApplicationService } from '@adonisjs/core/types'

export default class SpeQueueProvider {
 constructor(protected app: ApplicationService) {}

 /**
  * Register bindings to the container
  */
 register() {}

 /**
  * The container bindings have booted
  */
 async boot() {
  if (this.app.getEnvironment() === 'web') {
   const { startSPEWorker } = await import('#services/spe_worker_service')
   startSPEWorker()
   console.log('✅ SPE Worker is now active and listening to Redis')
  }
 }

 /**
  * The application has been booted
  */
 async start() {}

 /**
  * The process has been started
  */
 async ready() {}

 /**
  * Preparing to shutdown the app
  */
 async shutdown() {
  const { speWorker } = await import('#services/spe_worker_service')
  if (speWorker) {
   await speWorker.close()
   console.log('🛑 SPE Worker has been shut down gracefully')
  }
 }
}
