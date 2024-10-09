import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import MyRouter from './router/Router'
import { Spin } from 'antd';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <Suspense fallback={<Spin />}>
            <MyRouter></MyRouter>
        </Suspense>
    </BrowserRouter>
);