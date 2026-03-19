import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from './LoginPage'
import { ProfilePage } from './ProfilePage'
import { RoutesPage } from './RoutesPage'
import { BrowseRidesPage } from './BrowseRidesPage'
import { DriverRequestsPage } from './DriverRequestsPage'
import { MyRequestsPage } from './MyRequestsPage'
import { MembersPage } from './MembersPage'
import { OrganizationSettingsPage } from './OrganizationSettingsPage'
import { HistoryPage } from './HistoryPage'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<App />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/browse-rides" element={<BrowseRidesPage />} />
            <Route path="/driver-requests" element={<DriverRequestsPage />} />
            <Route path="/my-requests" element={<MyRequestsPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/organization-settings" element={<OrganizationSettingsPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)