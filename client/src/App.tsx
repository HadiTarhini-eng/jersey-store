import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ScrollToTop } from './components/common/ScrollToTop';
import { PageSpinner } from './components/ui/Spinner';
import { ToastProvider } from './components/ui/Toast';
import { ROUTES } from './config/routes';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { fetchCurrentUser } from './features/auth/authSlice';
import { hydrateAuthenticatedCart, rehydrateCart } from './features/cart/cartSlice';
import { getStoredCart } from './utils/storage';

// Code-split every page — only the current route is loaded
const HomePage          = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ShopPage          = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CartPage          = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage      = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const LoginPage         = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage      = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ProfilePage       = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Admin section — own layout, sidebar, role gate
const AdminLayout       = lazy(() => import('./admin/components/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminGuard        = lazy(() => import('./admin/components/AdminGuard').then((m) => ({ default: m.AdminGuard })));
const AdminDashboard    = lazy(() => import('./admin/pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminOrders       = lazy(() => import('./admin/pages/AdminOrders').then((m) => ({ default: m.AdminOrders })));
const AdminOrderDetail  = lazy(() => import('./admin/pages/AdminOrders').then((m) => ({ default: m.AdminOrderDetail })));
const AdminCustomers    = lazy(() => import('./admin/pages/AdminCustomers').then((m) => ({ default: m.AdminCustomers })));
const AdminProducts     = lazy(() => import('./admin/pages/AdminProducts').then((m) => ({ default: m.AdminProducts })));
const AdminAddProduct   = lazy(() => import('./admin/pages/AdminProducts').then((m) => ({ default: m.AdminAddProduct })));
const AdminEditProduct  = lazy(() => import('./admin/pages/AdminProducts').then((m) => ({ default: m.AdminEditProduct })));
const AdminOffers       = lazy(() => import('./admin/pages/AdminOffers').then((m) => ({ default: m.AdminOffers })));
const AdminCategories   = lazy(() => import('./admin/pages/AdminCategories').then((m) => ({ default: m.AdminCategories })));
const AdminSettings     = lazy(() => import('./admin/pages/AdminSettings').then((m) => ({ default: m.AdminSettings })));

function AppRoutes() {
  const dispatch    = useAppDispatch();
  const { token, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (token && !user) dispatch(fetchCurrentUser());
  }, [dispatch, token, user]);

  useEffect(() => {
    if (user?.id) {
      void dispatch(hydrateAuthenticatedCart(user.id));
      return;
    }

    if (!token) dispatch(rehydrateCart(getStoredCart(null)));
  }, [dispatch, token, user?.id]);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* ── Admin section — own layout, role-gated ─────────────────────── */}
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index                  element={<AdminDashboard />} />
            <Route path="orders"          element={<AdminOrders />} />
            <Route path="orders/:id"      element={<AdminOrderDetail />} />
            <Route path="customers"       element={<AdminCustomers />} />
            <Route path="products"        element={<AdminProducts />} />
            <Route path="products/new"    element={<AdminAddProduct />} />
            <Route path="products/:id/edit" element={<AdminEditProduct />} />
            <Route path="offers"          element={<AdminOffers />} />
            <Route path="categories"      element={<AdminCategories />} />
            <Route path="settings"        element={<AdminSettings />} />
          </Route>

          {/* ── Storefront — uses the public Layout ────────────────────────── */}
          <Route element={<StorefrontLayout />}>
            <Route path={ROUTES.HOME}    element={<HomePage />} />
            <Route path={ROUTES.SHOP}    element={<ShopPage />} />
            <Route path={ROUTES.PRODUCT} element={<ProductDetailPage />} />
            <Route path={ROUTES.CART}    element={<CartPage />} />

            <Route
              path={ROUTES.CHECKOUT}
              element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}
            />
            <Route
              path={ROUTES.PROFILE}
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />
            <Route
              path={ROUTES.LOGIN}
              element={<ProtectedRoute redirectIfAuthenticated><LoginPage /></ProtectedRoute>}
            />
            <Route
              path={ROUTES.REGISTER}
              element={<ProtectedRoute redirectIfAuthenticated><RegisterPage /></ProtectedRoute>}
            />

            <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

/** Wraps the public storefront pages with the standard Header + Footer layout. */
function StorefrontLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  );
}
