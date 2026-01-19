/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router.on('/').render('pages/home')
router.on('/tes').render('pages/tes')
router.on('/login').render('pages/login')
router
 .group(() => {
  router.post('/login', '#controllers/backends_controller.login')
  router.delete('/logout', '#controllers/backends_controller.menu')
 })
 .prefix('/authentication')
router
 .group(() => {
  // API Handling CRUD Opertion
  router.get('collections/:col', '#controllers/backends_controller.getCollectionData')
  router.get('collections/:col/:id', '#controllers/backends_controller.getCollectionDataDetail')
  router
   .post('collections/:col/', '#controllers/backends_controller.createCollectionData')
   .use(middleware.smartProjectionEngine())
  router
   .put('collections/:col/:id', '#controllers/backends_controller.updateCollectionData')
   .use(middleware.smartProjectionEngine())
  router
   .delete('collections/:col/:id', '#controllers/backends_controller.deleteCollectionData')
   .use(middleware.smartProjectionEngine())

  //   API Handling System
  router.get('/list-menu', '#controllers/backends_controller.listMenu')
  router.patch('/patch-menu', '#controllers/backends_controller.patchMenu')
  router.post('/dashboard-snapshot', '#controllers/backends_controller.dashboardSnapshots')
  router.get('/settings', '#controllers/backends_controller.settingsGeneral')
 })
 .prefix('/api')
