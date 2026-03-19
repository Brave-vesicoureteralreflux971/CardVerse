import { createRouter, createWebHistory } from 'vue-router';
import AdminLayout from '../layouts/AdminLayout.vue';
import { useAdminState } from '../composables/useAdminState';

const LoginPage = () => import('../pages/LoginPage.vue');
const DashboardPage = () => import('../pages/DashboardPage.vue');
const CatalogPage = () => import('../pages/CatalogPage.vue');
const CardsPage = () => import('../pages/CardsPage.vue');
const CouponsPage = () => import('../pages/CouponsPage.vue');
const OrdersPage = () => import('../pages/OrdersPage.vue');
const PaymentsPage = () => import('../pages/PaymentsPage.vue');
const MailsPage = () => import('../pages/MailsPage.vue');
const SystemPage = () => import('../pages/SystemPage.vue');

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    { path: '/login', component: LoginPage, meta: { guestOnly: true } },
    {
      path: '/',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: DashboardPage },
        { path: 'catalog', component: CatalogPage },
        { path: 'cards', component: CardsPage },
        { path: 'coupons', component: CouponsPage },
        { path: 'orders', component: OrdersPage },
        { path: 'payments', component: PaymentsPage },
        { path: 'mails', component: MailsPage },
        { path: 'system', component: SystemPage },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const admin = useAdminState();
  const authed = admin.loggedIn.value || (await admin.initializeSession());

  if (to.meta.requiresAuth && !authed) {
    return '/login';
  }

  if (to.meta.guestOnly && authed) {
    return '/dashboard';
  }

  return true;
});

export default router;

