const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') }
    ]
  },
  {
    path: '/Login',
    component: () => import('pages/LoginPage.vue')
  },
  {
    path: '/Government',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {path: '', component: () => import('pages/GovernmentIssuencePage.vue')}
    ]
  },
  { path: '/GovernmentAlice', 
    component: () => import('layouts/MainLayout.vue'), 
    children: [
      {path: '', component: () => import('pages/GovernmentIssuencePageForHR.vue')}
    ]
  },
  {path: '/HRecive',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {path: '', component: () => import('pages/CompanyHiringManagerIssuence.vue')}
    ]
  },
  {path: '/ApplyPage',
    children: [
      {path: '', component: () => import('pages/ApplyPage.vue')}
    ]
  },
  {
    path: '/University',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {path: '', component: () => import('pages/DiplomaIssuencePage.vue')}
    ]
  },
  {
    path: '/DigiSoft',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {path: '', component: () => import('pages/ProofOfEmployementPage.vue')}
    ]
  },
  {path: '/initialiseCredilink',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {path:'', component: () => import('pages/CrediLinkCredentials.vue')}
    ]
  },
  
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
