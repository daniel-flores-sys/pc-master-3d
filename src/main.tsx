import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import './index.css';
import { ProgressProvider } from './lib/ProgressProvider';
import { ThemeProvider } from './theme/ThemeProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
