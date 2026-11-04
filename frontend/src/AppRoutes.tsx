import { Route, Routes } from 'react-router';
import { App } from './App';
import { AdminHome } from './admin/AdminHome';
import { AdminLogin } from './admin/AdminLogin';
import { EditRestaurant } from './admin/EditRestaurant';
import { NewRestaurant } from './admin/NewRestaurant';
import { RequireAdmin } from './admin/RequireAdmin';
import { NotFound } from './NotFound';

// Every page of the site and of the panel. Any other path, including one
// inside /admin, shows the not found page.
export function AppRoutes() {
  return (
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
