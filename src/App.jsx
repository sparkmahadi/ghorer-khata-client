import { useEffect } from 'react';
import React from 'react';
import './App.css'
import Aos from 'aos';
import router from './routes/router';
import { RouterProvider } from 'react-router';

function App() {
  useEffect(()=>{
    Aos.init();
    Aos.refresh();
  },[])
  return (
    <div className='relative'>
      <RouterProvider router={router}>
      </RouterProvider>
    </div>
  );
}

export default App
