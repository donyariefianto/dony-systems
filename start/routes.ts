/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router.on('/').render('pages/home')
router.on('/login').render('pages/login')
router
 .group(() => {
  router.post('/login', '#controllers/backends_controller.login')
  router.delete('/logout', '#controllers/backends_controller.menu')
 })
 .prefix('/authentication')
router
 .group(() => {
  router.get('/menu', '#controllers/backends_controller.menu')
  router.get('/dashboard-snapshot', '#controllers/backends_controller.dashboardStats')
  router.get('/settings', '#controllers/backends_controller.settingsGeneral')
  router.get('collections/:col', '#controllers/backends_controller.getCollectionData')
  router.get('collections/:col/:id', '#controllers/backends_controller.getCollectionDataDetail')
  router.post('collections/:col/', '#controllers/backends_controller.createCollectionData')
  router.put('collections/:col/:id', '#controllers/backends_controller.updateCollectionData')
  router.delete('collections/:col/:id', '#controllers/backends_controller.deleteCollectionData')
 })
 .prefix('/api')
