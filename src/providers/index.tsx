import React from "react";
import AuthProvider from "./AuthProvider";
import { NotificationProvider } from "./NotificationProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  );
};

export default Providers;
