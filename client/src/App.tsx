import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PageSpinner } from './components/ui/Spinner';
import { ROUTES } from './config/routes';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { fetchCurrentUser } from './features/auth/authSlice';
import { rehydrateCart } from './features/cart/cartSlice';
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

function AppRoutes() {
  const dispatch    = useAppDispatch();
  const { tokens, user } = useAppSelector((s) => s.auth);

  // On first mount: validate stored JWT and hydrate user
  useEffect(() => {
    if (tokens?.accessToken && !user) {
      dispatch(fetchCurrentUser());
    }
  }, []);

  // Hydrate cart whenever the authenticated user changes
  useEffect(() => {
    dispatch(rehydrateCart(getStoredCart(user?.id ?? null)));
  }, [user?.id]);

  return (
    <Layout>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path={ROUTES.HOME}    element={<HomePage />} />
          <Route path={ROUTES.SHOP}    element={<ShopPage />} />
          <Route path={ROUTES.PRODUCT} element={<ProductDetailPage />} />
          <Route path={ROUTES.CART}    element={<CartPage />} />

          {/* Auth-required routes */}
          <Route
            path={ROUTES.CHECKOUT}
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PROFILE}
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Redirect authenticated users away from auth pages */}
          <Route
            path={ROUTES.LOGIN}
            element={
              <ProtectedRoute redirectIfAuthenticated>
                <LoginPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.REGISTER}
            element={
              <ProtectedRoute redirectIfAuthenticated>
                <RegisterPage />
              </ProtectedRoute>
            }
          />

          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
