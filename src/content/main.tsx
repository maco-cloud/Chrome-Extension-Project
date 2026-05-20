import '../styles/globals.css';
import { mountContentApp } from './App';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountContentApp);
} else {
  mountContentApp();
}
