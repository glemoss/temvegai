import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { App } from './App';
import { AdminHome } from './admin/AdminHome';
import { AdminLogin } from './admin/AdminLogin';
import { EditRestaurant } from './admin/EditRestaurant';
import { NewRestaurant } from './admin/NewRestaurant';
import { RequireAdmin } from './admin/RequireAdmin';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Elemento #root não encontrado');
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAdmin />}>
          <Route element={<AdminHome />}>
            <Route index element={null} />
            <Route path="restaurants/new" element={<NewRestaurant />} />
            <Route path="restaurants/:id/edit" element={<EditRestaurant />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
