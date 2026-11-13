import { Navigate, Route, Routes } from 'react-router';
import { App } from './App';
import { AdminLogin } from './admin/AdminLogin';
import { EditRestaurant } from './admin/EditRestaurant';
import { NewRestaurant } from './admin/NewRestaurant';
import { RequireAdmin } from './admin/RequireAdmin';
import { RestaurantsPage } from './admin/RestaurantsPage';
import { ReviewSuggestion } from './admin/ReviewSuggestion';
import { SuggestionsPage } from './admin/SuggestionsPage';
import { NotFound } from './NotFound';

// Every page of the site and of the panel. Any other path, including one
// inside /admin, shows the not found page. The panel opens on the
// restaurants module.
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<RequireAdmin />}>
        <Route index element={<Navigate to="restaurants" replace />} />
        <Route path="restaurants" element={<RestaurantsPage />}>
          <Route index element={null} />
          <Route path="new" element={<NewRestaurant />} />
          <Route path=":id/edit" element={<EditRestaurant />} />
        </Route>
        <Route path="suggestions" element={<SuggestionsPage />}>
          <Route index element={null} />
          <Route path=":id/review" element={<ReviewSuggestion />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
