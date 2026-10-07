import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import LoginView from './views/LoginView';
import PharmacistView from './views/PharmacistView';
import DriverView from './views/DriverView';
import ManagerView from './views/ManagerView';
import CitizenView from './views/CitizenView';
import './App.css';
import NotificationDrawer from './components/NotificationDrawer';

function MainRouter() {
  const { currentUser, userRoles } = useAuth();

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="app-layout">
      <Navbar/>

      <main className="main-content-area">
        {currentUser.role === userRoles.FARMACEUTICO && <PharmacistView />}
        {currentUser.role === userRoles.ENTREGADOR && <DriverView />}
        {currentUser.role === userRoles.GERENTE && <ManagerView />}
        {currentUser.role === userRoles.CLIENTE && <CitizenView />}
      </main>

      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <MainRouter />
      </AppDataProvider>
    </AuthProvider>
  );
}
