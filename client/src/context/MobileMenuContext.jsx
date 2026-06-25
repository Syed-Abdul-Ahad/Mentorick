import { createContext, useContext } from 'react';

const MobileMenuContext = createContext(null);

export const MobileMenuProvider = ({ value, children }) => (
  <MobileMenuContext.Provider value={value}>{children}</MobileMenuContext.Provider>
);

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error('useMobileMenu must be used within MainLayout');
  }
  return context;
};
