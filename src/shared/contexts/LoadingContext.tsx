import React, { createContext, useContext, useState } from 'react';
import { LoadingScreen } from "@shared/components/LoadingScreen";

interface LoadingContextType {
  setIsLoading: (loading: boolean, message?: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Loading...");

  const setIsLoading = (isLoading: boolean, msg?: string) => {
    if (msg) setMessage(msg);
    setLoading(isLoading);
  };

  return (
    <LoadingContext.Provider value={{ setIsLoading }}>
      {children}
      {/* This renders the loader on TOP of every screen in the app */}
      {loading && <LoadingScreen title={message} />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) throw new Error("useLoading must be used within a LoadingProvider");
  return context;
};