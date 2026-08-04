import React from 'react';import ReactDOM from 'react-dom/client';import App from './App';import { IndexedDbProjectRepository } from './repository/IndexedDbProjectRepository';import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App repository={new IndexedDbProjectRepository()}/></React.StrictMode>);
if('serviceWorker'in navigator&&import.meta.env.PROD) addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}));
