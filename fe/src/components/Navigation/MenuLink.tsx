import React from 'react';
import { useLocation } from 'react-router-dom';

interface MenuLinkProps {
    href: string;
    label: React.ReactNode;
    currentPath: string;
    onClick?: () => void;
}

function MenuLink({ href, label, currentPath, onClick }: MenuLinkProps) {
    const location = useLocation();
    const isActive = location.pathname === currentPath;

    return (
        <a
            href={href}
            onClick={onClick}
            className={`link no-underline px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            aria-current={isActive ? 'page' : undefined}
        >
            {label}
        </a>
    );
};

export default MenuLink;
