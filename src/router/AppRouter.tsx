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



import React, { useEffect } from "react";
import { createBrowserRouter, RouterProvider, useLocation } from "react-router-dom";
import Layout from "../components/Layout/Layout";

// Page imports
import HomePage from "../pages/Home/HomePage";
import ProductsPage from "../pages/Products/ProductsPage";
import ProductDetailPage from "../pages/Products/ProductDetailPage";
import DealsPage from "../pages/Products/DealsPage";
import NewArrivalsPage from "../pages/Products/NewArrivalsPage";
import BestSellersPage from "../pages/Products/BestSellersPage";
import VendorStorefrontPage from "../pages/Vendor/VendorStorefrontPage";
import CartPage from "../pages/Cart/CartPage";
import CheckoutPage from "../pages/Checkout/CheckoutPage";
import OrdersPage from "../pages/Orders/OrdersPage";
import OrderDetailPage from "../pages/Orders/OrderDetailPage";
import TrackOrderPage from "../pages/Orders/TrackOrderPage";
import RateOrderPage from "../pages/Orders/RateOrderPage";

// Account pages
import AccountPage from "../pages/Account/AccountPage";
import WishlistPage from "../pages/Account/WishlistPage";
import ContactAdminPage from "../pages/Account/ContactAdminPage";

// Auth pages
import { LoginPage, RegisterPage, RegistrationSuccessPage, VerifyEmailPage } from "../pages/Auth";

// Support pages
import ContactPage from "../pages/Support/ContactPage";
import FAQPage from "../pages/Support/FAQPage";
import TermsPage from "../pages/Support/TermsPage";

// Additional pages
import CategoryPage from "../pages/Categories/CategoryPage";
import SearchResultsPage from "../pages/Search/SearchResultsPage";
import NotFoundPage from "../pages/Error/NotFoundPage";
import UIComponentsDemo from "../pages/Demo/UIComponentsDemo";

// Services pages
import { ServicesLandingPage, ServicesPage } from "../pages/Services";

// Layout components
import AuthLayout from "../components/Layout/AuthLayout";
import { ProtectedRoute } from "../components/Auth";
import AboutPage from "@/pages/About/page";

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
        element: <ProductsPage />,
      },
      {
        path: "products/:id",
        element: <ProductDetailPage />,
      },
      {
        path: "deals",
        element: <DealsPage />,
      },
      {
        path: "new-arrivals",
        element: <NewArrivalsPage />,
      },
      {
        path: "bestsellers",
        element: <BestSellersPage />,
      },
      {
        path: "vendor/:vendorId",
        element: <VendorStorefrontPage />,
      },
      {
        path: "cart",
        element: <CartPage />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        path: "orders",
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "orders/:id",
        element: (
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "track-order/:id",
        element: (
          <ProtectedRoute>
            <TrackOrderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "rate-order/:orderId",
        element: (
          <ProtectedRoute>
            <RateOrderPage />
          </ProtectedRoute>
        ),
      },
      // Account routes
      {
        path: "account",
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "wishlist",
        element: (
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "contact-admin",
        element: (
          <ProtectedRoute>
            <ContactAdminPage />
          </ProtectedRoute>
        ),
      },
      // Support routes
      {
        path: "contact",
        element: <ContactPage />,
      },
      {
        path: "terms",
        element: <TermsPage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "faq",
        element: <FAQPage />,
      },
      // Services routes
      {
        path: "services",
        element: <ServicesLandingPage />,
      },
      {
        path: "services/:subcategory",
        element: <ServicesPage />,
      },
      // Category and search routes
      {
        path: "category/:categoryId",
        element: <CategoryPage />,
      },
      {
        path: "search",
        element: <SearchResultsPage />,
      },
      // Demo route (for development)
      {
        path: "demo",
        element: <UIComponentsDemo />,
      },
      // 404 catch-all
      {
        path: "*",
        element: <NotFoundPage />,
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
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "registration-success",
        element: <RegistrationSuccessPage />,
      },
      {
        path: "verify-email",
        element: <VerifyEmailPage />,
      },
    ],
  },
]);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;