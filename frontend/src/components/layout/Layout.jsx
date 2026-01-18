import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="layout">
            <Navbar
                onMenuToggle={toggleSidebar}
                isSidebarOpen={sidebarOpen}
            />
            <Sidebar
                isOpen={sidebarOpen}
                onClose={closeSidebar}
            />
            <main className="main-content">
                {children || <Outlet />}
            </main>
        </div>
    );
};

export default Layout;
