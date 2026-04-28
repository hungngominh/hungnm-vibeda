import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './themes.css';
import { App } from './App';

const saved = localStorage.getItem('moodaily-mascot');
if (saved) document.documentElement.dataset.theme = saved;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
