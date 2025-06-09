import { createBrowserRouter } from 'react-router';
import MainLayout from '../layouts/Main';
import React from 'react';
import HomePage from '../pages/Homepage/Homepage';
import RegisterPage from '../pages/Register/Register';
import LoginPage from '../pages/Login/Login';
import DashboardPage from '../pages/DashboardPage/DashboardPage';
import Categories from '../pages/Categories/Categories';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/categories', element: <Categories /> },
      { path: '/dashboard', element: <DashboardPage /> },
    //   { path: 'about', element: <About /> },
    ],
    // errorElement: <ErrorPage />,
  },
]);

export default router;
