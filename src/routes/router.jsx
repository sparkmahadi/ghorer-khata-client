import { createBrowserRouter, Navigate } from 'react-router';
import MainLayout from '../layouts/Main';
import React from 'react';
import HomePage from '../pages/Homepage/Homepage';
import RegisterPage from '../pages/Register/Register';
import LoginPage from '../pages/Login/Login';
import DashboardPage from '../pages/DashboardPage/DashboardPage';
import Categories from '../pages/Categories/Categories';
import CategoryDetail from '../pages/Categories/CategoryDetail';
import ProductList from '../pages/ProductList/ProductList';
import Products from '../pages/Products/Products';
import ProductDetail from '../pages/Products/ProductDetail';
import Budget from '../pages/Budget/Budget';
import BudgetMiniDetail from '../pages/Budget/BudgetMiniDetail';
import BudgetDetails from '../pages/Budget/BudgetDetails';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/categories', element: <Categories /> },
      { path: '/products', element: <Products /> },
      { path: "/products/details/:id", element: <ProductDetail /> },
      { path: '/categories/:id', element: <CategoryDetail /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/dashboard/products-list', element: <ProductList /> },
      { path: '//budgets', element: <Budget /> },
      { path: '//budgets/:budgetId', element: <BudgetDetails /> },
      //   { path: 'about', element: <About /> },
    ],
    // errorElement: <ErrorPage />,
  },

  // {
  //   path: "/",
  //   element: <BudgetLayout />, // Your main layout providing totalBudget, categories, editing states etc. via OutletContext
  //   children: [
  //     {
  //       index: true, 
  //       element: <BudgetDashboard />, // Or desired landing page
  //     },
  //     {
  //       path: "dashboard",
  //       element: <BudgetDashboard />,
  //     },
  //     {
  //       path: "allocation-hub",
  //       element: <AllocationHub />, // AllocationHub acts as a layout for its children
  //       children: [
  //         {
  //           index: true, // Default route for /allocation-hub (renders EditCategory by default)
  //           element: <EditCategory />,
  //         },
  //         {
  //           path: "category", // /allocation-hub/category
  //           element: <EditCategory />,
  //         },
  //         {
  //           path: "subcategory", // /allocation-hub/subcategory
  //           element: <EditSubcategory />,
  //         },
  //         {
  //           path: "item", // /allocation-hub/item
  //           element: <EditItem />,
  //         },
  //       ],
  //     },
  //     // IMPORTANT: Removed routes for creating new entities
  //     // {
  //     //   path: "create-category",
  //     //   element: <CreateCategory />,
  //     // },
  //     // {
  //     //   path: "create-subcategory/:parentId",
  //     //   element: <CreateSubcategory />,
  //     // },
  //     // {
  //     //   path: "create-item/:categoryId/:subcategoryId",
  //     //   element: <CreateItem />,
  //     // },
  //     // ... other routes
  //   ],
  // },
]);

export default router;
