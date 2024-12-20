import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Dashboard from '../components/Dashboard.vue'
import { useAuthStore } from '../stores/auth'
import Home from '../components/Home.vue'
import Register from '../components/Register.vue'
import VerifyCode from '../components/VerifyCode.vue'
import ForgotPassword from '../components/ForgotPassword.vue'
import ResetPassword from '../components/ResetPassword.vue'
import HazardMap from '../components/HazardMap.vue'
import Alerts from '../components/Alerts.vue'
import AboutUs from '../components/AboutUs.vue'
import EmailVerification from '../components/EmailVerification.vue'
import { useNotificationStore } from '../stores/notification'
import NotFound from '../views/NotFound.vue'
import Contact from '../components/Contact.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import DashboardView from '@/views/admin/DashboardView.vue'
import PostsView from '@/views/admin/PostsView.vue'

const requireAuth = (to, from, next) => {
  const authStore = useAuthStore()
  
  authStore.initializeAuth()
    .then(() => {
      if (!authStore.isAuthenticated) {
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
      } else {
        next()
      }
    })
    .catch(() => {
      next('/login')
    })
}

export const requireAdmin = async (to, from, next) => {
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  
  await authStore.initializeAuth()
  
  if (!authStore.isAuthenticated) {
    notificationStore.error('Please login to continue')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  if (!authStore.isAdmin) {
    notificationStore.error('Admin access required')
    next('/')
    return
  }
  
  next()
}

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { requiresAuth: false, allowGuest: true }
  },
  {
    path: '/home',
    redirect: '/'
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
    beforeEnter: requireAuth
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    beforeEnter: requireAdmin,
    children: [
      {
        path: '',
        redirect: 'dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: DashboardView
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UsersView.vue')
      },
      {
        path: 'alerts',
        name: 'AdminAlerts',
        component: () => import('@/views/admin/AlertsView.vue')
      },
      {
        path: 'posts',
        name: 'AdminPosts',
        component: () => import('@/views/admin/PostsView.vue')
      }
    ]
  },
  {
    path: '/verify-code',
    name: 'VerifyCode',
    component: VerifyCode
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword
  },
  {
    path: '/hazard-map',
    name: 'HazardMap',
    component: HazardMap,
    meta: { requiresAuth: true }
  },
  {
    path: '/checklist',
    name: 'PreparednessChecklist',
    component: () => import('../components/PreparednessChecklist.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: Alerts,
    meta: { requiresAuth: true }
  },
  {
    path: '/about',
    name: 'about',
    component: AboutUs
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../components/Profile.vue'),
    meta: { requiresAuth: true },
    beforeEnter: requireAuth
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('../components/ChangePassword.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/verify-email',
    name: 'EmailVerification',
    component: EmailVerification,
    props: route => ({ token: route.query.token })
  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../components/AdminLogin.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/news',
    name: 'News',
    component: () => import('../components/News.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/news',
    name: 'AdminNews',
    component: () => import('../components/AdminNewsManagement.vue'),
    meta: { 
      requiresAuth: true,
      requiresAdmin: true 
    },
    beforeEnter: requireAuth
  },
  {
    path: '/emergency-contacts',
    name: 'emergency-contacts',
    component: () => import('@/components/EmergencyContacts.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/first-aid',
    name: 'FirstAid',
    component: () => import('@/components/FirstAidGuide.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('@/components/Resources.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/evacuation-routes',
    name: 'EvacuationRoutes',
    component: () => import('@/components/EvacuationRoutes.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]


const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  
  // Skip for public routes
  if (!to.meta.requiresAuth) {
    return next()
  }

  authStore.initializeAuth()
    .then(() => {
      // Check admin routes
      if (to.meta.requiresAdmin) {
        if (!authStore.isAuthenticated) {
          notificationStore.error('Please login to access admin panel')
          return next('/login')
        }
        if (!authStore.isAdmin) {
          notificationStore.error('Admin access required')
          return next('/')
        }
      }

      // Handle regular authenticated routes
      if (!authStore.isAuthenticated) {
        notificationStore.error('Please login to continue')
        return next('/login')
      }

      next()
    })
    .catch(() => {
      notificationStore.error('Authentication error')
      next('/login')
    })
})

export default router 