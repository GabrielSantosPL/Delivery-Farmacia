import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import LoginView from './views/LoginView';
import PharmacistView from './views/PharmacistView';
import DriverView from './views/DriverView';
import CitizenView from './views/CitizenView';
import './App.css';
import NotificationDrawer from './components/NotificationDrawer';
import AppFooter from './components/AppFooter';

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
        {currentUser.role === userRoles.CLIENTE && <CitizenView />}
      </main>

      <AppFooter />
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
