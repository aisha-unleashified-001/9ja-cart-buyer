// import React from "react";
// import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import Layout from "../components/Layout/Layout";

// // Page imports
// import HomePage from "../pages/Home/HomePage";
// import ProductsPage from "../pages/Products/ProductsPage";
// import ProductDetailPage from "../pages/Products/ProductDetailPage";
// import CartPage from "../pages/Cart/CartPage";
// import CheckoutPage from "../pages/Checkout/CheckoutPage";
// import OrdersPage from "../pages/Orders/OrdersPage";
// import OrderDetailPage from "../pages/Orders/OrderDetailPage";
// import TrackOrderPage from "../pages/Orders/TrackOrderPage";

// // Account pages
// import AccountPage from "../pages/Account/AccountPage";
// import ProfilePage from "../pages/Account/ProfilePage";
// import SettingsPage from "../pages/Account/SettingsPage";
// import AddressesPage from "../pages/Account/AddressesPage";
// import PaymentMethodsPage from "../pages/Account/PaymentMethodsPage";
// import WishlistPage from "../pages/Account/WishlistPage";

// // Auth pages
// import LoginPage from "../pages/Auth/LoginPage";
// import RegisterPage from "../pages/Auth/RegisterPage";

// // Support pages
// import ContactPage from "../pages/Support/ContactPage";
// import FAQPage from "../pages/Support/FAQPage";

// // Additional pages
// import CategoryPage from "../pages/Categories/CategoryPage";
// import SearchResultsPage from "../pages/Search/SearchResultsPage";
// import NotFoundPage from "../pages/Error/NotFoundPage";
// import UIComponentsDemo from "../pages/Demo/UIComponentsDemo";

// // Layout components
// import AuthLayout from "../components/Layout/AuthLayout";

// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <Layout />,
//     children: [
//       {
//         index: true,
//         element: <HomePage />,
//       },
//       {
//         path: "products",
//         element: <ProductsPage />,
//       },
//       {
//         path: "products/:id",
//         element: <ProductDetailPage />,
//       },
//       {
//         path: "cart",
//         element: <CartPage />,
//       },
//       {
//         path: "checkout",
//         element: <CheckoutPage />,
//       },
//       {
//         path: "orders",
//         element: <OrdersPage />,
//       },
//       {
//         path: "orders/:id",
//         element: <OrderDetailPage />,
//       },
//       {
//         path: "track-order/:id",
//         element: <TrackOrderPage />,
//       },
//       // Account routes
//       {
//         path: "account",
//         element: <AccountPage />,
//       },
//       {
//         path: "profile",
//         element: <ProfilePage />,
//       },
//       {
//         path: "settings",
//         element: <SettingsPage />,
//       },
//       {
//         path: "addresses",
//         element: <AddressesPage />,
//       },
//       {
//         path: "payment-methods",
//         element: <PaymentMethodsPage />,
//       },
//       {
//         path: "wishlist",
//         element: <WishlistPage />,
//       },
//       // Support routes
//       {
//         path: "contact",
//         element: <ContactPage />,
//       },
//       {
//         path: "faq",
//         element: <FAQPage />,
//       },
//       // Category and search routes
//       {
//         path: "category/:category",
//         element: <CategoryPage />,
//       },
//       {
//         path: "search",
//         element: <SearchResultsPage />,
//       },
//       // Demo route (for development)
//       {
//         path: "demo",
//         element: <UIComponentsDemo />,
//       },
//       // 404 catch-all
//       {
//         path: "*",
//         element: <NotFoundPage />,
//       },
//     ],
//   },
//   // Auth routes (with AuthLayout)
//   {
//     path: "auth",
//     element: <AuthLayout />,
//     children: [
//       {
//         path: "login",
//         element: <LoginPage />,
//       },
//       {
//         path: "register",
//         element: <RegisterPage />,
//       },
//     ],
//   },
// ]);

// const AppRouter: React.FC = () => {
//   return <RouterProvider router={router} />;
// };

// export default AppRouter;



import React, { Suspense, lazy, useEffect } from "react";
import { createBrowserRouter, RouterProvider, useLocation } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import { Loading } from "../components/UI";

// HomePage eager - critical for fast reload
import HomePage from "../pages/Home/HomePage";

// Route-level code splitting: lazy load non-home routes for smaller initial bundle
const ProductsPage = lazy(() => import("../pages/Products/ProductsPage"));
const ProductDetailPage = lazy(() => import("../pages/Products/ProductDetailPage"));
const DealsPage = lazy(() => import("../pages/Products/DealsPage"));
const NewArrivalsPage = lazy(() => import("../pages/Products/NewArrivalsPage"));
const BestSellersPage = lazy(() => import("../pages/Products/BestSellersPage"));
const VendorStorefrontPage = lazy(() => import("../pages/Vendor/VendorStorefrontPage"));
const CartPage = lazy(() => import("../pages/Cart/CartPage"));
const CheckoutPage = lazy(() => import("../pages/Checkout/CheckoutPage"));
const OrdersPage = lazy(() => import("../pages/Orders/OrdersPage"));
const OrderDetailPage = lazy(() => import("../pages/Orders/OrderDetailPage"));
const TrackOrderPage = lazy(() => import("../pages/Orders/TrackOrderPage"));
const RateOrderPage = lazy(() => import("../pages/Orders/RateOrderPage"));
const AccountPage = lazy(() => import("../pages/Account/AccountPage"));
const WishlistPage = lazy(() => import("../pages/Account/WishlistPage"));
const ContactAdminPage = lazy(() => import("../pages/Account/ContactAdminPage"));
const ContactPage = lazy(() => import("../pages/Support/ContactPage"));
const FAQPage = lazy(() => import("../pages/Support/FAQPage"));
const TermsPage = lazy(() => import("../pages/Support/TermsPage"));
const PrivacyPolicyPage = lazy(() => import("../pages/Support/PrivacyPolicyPage"));
const TermsOfUsePage = lazy(() => import("../pages/Support/TermsOfUsePage"));
const ShippingReturnPolicyPage = lazy(() => import("../pages/Support/ShippingReturnPolicyPage"));
const RefundPolicyPage = lazy(() => import("../pages/Support/RefundPolicyPage"));
const DisputePolicyPage = lazy(() => import("../pages/Support/DisputePolicyPage"));
const CategoryPage = lazy(() => import("../pages/Categories/CategoryPage"));
const SearchResultsPage = lazy(() => import("../pages/Search/SearchResultsPage"));
const NotFoundPage = lazy(() => import("../pages/Error/NotFoundPage"));
const UIComponentsDemo = lazy(() => import("../pages/Demo/UIComponentsDemo"));
const ServicesLandingPage = lazy(() => import("../pages/Services").then((m) => ({ default: m.ServicesLandingPage })));
const ServicesPage = lazy(() => import("../pages/Services").then((m) => ({ default: m.ServicesPage })));
const LoginPage = lazy(() => import("../pages/Auth").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("../pages/Auth").then((m) => ({ default: m.RegisterPage })));
const RegistrationSuccessPage = lazy(() => import("../pages/Auth").then((m) => ({ default: m.RegistrationSuccessPage })));
const ResetPasswordPage = lazy(() => import("../pages/Auth").then((m) => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import("../pages/Auth").then((m) => ({ default: m.VerifyEmailPage })));
const AboutPage = lazy(() => import("@/pages/About/page"));

// Layout components
import AuthLayout from "../components/Layout/AuthLayout";
import { ProtectedRoute } from "../components/Auth";

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loading size="lg" />
  </div>
);

const withSuspense = (Node: React.ReactNode) => (
  <Suspense fallback={<PageFallback />}>{Node}</Suspense>
);

// Scroll to Top Component
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth", // Use 'auto' for instant scrolling
    });
  }, [pathname]);

  return null;
};

// Layout Wrapper with ScrollToTop
const LayoutWithScrollToTop: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Layout />
    </>
  );
};

// Auth Layout Wrapper with ScrollToTop  
const AuthLayoutWithScrollToTop: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <AuthLayout />
    </>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <LayoutWithScrollToTop />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "products",
        element: withSuspense(<ProductsPage />),
      },
      {
        path: "products/:id",
        element: withSuspense(<ProductDetailPage />),
      },
      {
        path: "deals",
        element: withSuspense(<DealsPage />),
      },
      {
        path: "new-arrivals",
        element: withSuspense(<NewArrivalsPage />),
      },
      {
        path: "bestsellers",
        element: withSuspense(<BestSellersPage />),
      },
      {
        path: "vendor/:vendorId",
        element: withSuspense(<VendorStorefrontPage />),
      },
      {
        path: "cart",
        element: withSuspense(<CartPage />),
      },
      {
        path: "checkout",
        element: withSuspense(<CheckoutPage />),
      },
      {
        path: "orders",
        element: withSuspense(
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "orders/:id",
        element: withSuspense(
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "track-order/:id",
        element: withSuspense(
          <ProtectedRoute>
            <TrackOrderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "rate-order/:orderId",
        element: withSuspense(
          <ProtectedRoute>
            <RateOrderPage />
          </ProtectedRoute>
        ),
      },
      // Account routes
      {
        path: "account",
        element: withSuspense(
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "wishlist",
        element: withSuspense(
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "contact-admin",
        element: withSuspense(
          <ProtectedRoute>
            <ContactAdminPage />
          </ProtectedRoute>
        ),
      },
      // Support routes
      {
        path: "contact",
        element: withSuspense(<ContactPage />),
      },
      {
        path: "terms",
        element: withSuspense(<TermsPage />),
      },
      {
        path: "privacy",
        element: withSuspense(<PrivacyPolicyPage />),
      },
      {
        path: "terms-of-use",
        element: withSuspense(<TermsOfUsePage />),
      },
      {
        path: "shipping-return-policy",
        element: withSuspense(<ShippingReturnPolicyPage />),
      },
      {
        path: "refund-policy",
        element: withSuspense(<RefundPolicyPage />),
      },
      {
        path: "dispute-policy",
        element: withSuspense(<DisputePolicyPage />),
      },
      {
        path: "about",
        element: withSuspense(<AboutPage />),
      },
      {
        path: "faq",
        element: withSuspense(<FAQPage />),
      },
      // Services routes
      {
        path: "services",
        element: withSuspense(<ServicesLandingPage />),
      },
      {
        path: "services/:subcategory",
        element: withSuspense(<ServicesPage />),
      },
      // Category and search routes
      {
        path: "category/:categoryId",
        element: withSuspense(<CategoryPage />),
      },
      {
        path: "search",
        element: withSuspense(<SearchResultsPage />),
      },
      // Demo route (for development)
      {
        path: "demo",
        element: withSuspense(<UIComponentsDemo />),
      },
      // 404 catch-all
      {
        path: "*",
        element: withSuspense(<NotFoundPage />),
      },
    ],
  },
  // Auth routes (with AuthLayout)
  {
    path: "auth",
    element: <AuthLayoutWithScrollToTop />,
    children: [
      {
        path: "login",
        element: withSuspense(<LoginPage />),
      },
      {
        path: "register",
        element: withSuspense(<RegisterPage />),
      },
      {
        path: "registration-success",
        element: withSuspense(<RegistrationSuccessPage />),
      },
      {
        path: "reset-password",
        element: withSuspense(<ResetPasswordPage />),
      },
      {
        path: "verify-email",
        element: withSuspense(<VerifyEmailPage />),
      },
    ],
  },
]);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;