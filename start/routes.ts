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
  router.post('/v2/login', '#controllers/backends_controller.authentication_login')
  router.patch('/v2/refresh', '#controllers/backends_controller.authentication_refresh')
  router
   .delete('/v2/logout', '#controllers/backends_controller.authentication_logout')
   .use(middleware.authentication())
 })
 .prefix('/authentication')
router
 .group(() => {
  // API Handling CRUD Opertion
  router.get(
   'collections-aggregation/:col',
   '#controllers/backends_controller.aggreateCollectionData'
  )
  router.post(
   'collections-aggregation/:col',
   '#controllers/backends_controller.aggregateCollectionData'
  )
  router.get('collections/:col', '#controllers/backends_controller.getCollectionData')
  router.get('collections/:col/:id', '#controllers/backends_controller.getCollectionDataDetail')
  router
   .post('collections/:col/', '#controllers/backends_controller.createCollectionData')
   .use(middleware.speDispatcher())
  router
   .put('collections/:col/:id', '#controllers/backends_controller.updateCollectionData')
   .use(middleware.speDispatcher())
  router
   .delete('collections/:col/:id', '#controllers/backends_controller.deleteCollectionData')
   .use(middleware.speDispatcher())
  router.delete('collections/:col', '#controllers/backends_controller.deleteCollection')

  //   API Handling System
  router.get('/list-menu', '#controllers/backends_controller.listMenu')
  router.patch('/patch-menu', '#controllers/backends_controller.patchMenu')
  router.get('/settings', '#controllers/backends_controller.settingsGeneral')
  router.patch('/settings', '#controllers/backends_controller.patchGeneralSettings')
  router.post('/test-formula', '#controllers/backends_controller.runTestFormulaSPE')
  router.post('/test-formula-v2', '#controllers/backends_controller.runTestFormulaSPEV2')
 })
 .prefix('/api')
