import React, { useState } from 'react';
import { Home, PiggyBank, ReceiptText, BarChart2, Menu, X, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router';

// A simple Navbar component
const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { userInfo, isAuthenticated, logout } = useAuth();


    const navItems = [
        { name: 'Dashboard', icon: Home, href: '/dashboard' },
        { name: 'Products', icon: Home, href: '/products' },
        { name: 'Categories', icon: Home, href: '/categories' },
        { name: 'Budgets', icon: PiggyBank, href: '/budgets' },
        { name: 'Expenses', icon: ReceiptText, href: '/expenses' },
        { name: 'Reports', icon: BarChart2, href: '/reports' },
    ];

    return (
        <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 shadow-lg font-inter text-white">
            <div className="container mx-auto flex justify-between items-center flex-wrap">
                {/* App Title/Logo */}
                <Link to={'/'} className="flex items-center text-xl font-bold rounded-md px-3 py-1 cursor-pointer hover:bg-blue-700 transition duration-300">
                    Family Budget
                </Link>

                {/* Mobile menu button */}
                <div className="md:hidden">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white p-2 rounded-md transition duration-300 hover:bg-blue-700"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center space-x-6">
                    {navItems?.map((item) => (
                        <Link
                            key={item?.name}
                            to={item?.href}
                            className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md transform hover:scale-105"
                        >
                            {/* <item?.icon size={20} /> */}
                            <span className="font-medium">{item?.name}</span>
                        </Link>
                    ))}

                    {
                        !isAuthenticated ? <Link
                            to={'/login'}
                            className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md transform hover:scale-105"
                        >
                            {/* <item?.icon size={20} /> */}
                            <span className="font-medium">Login</span>
                        </Link>
                            :
                            <button
                            onClick={logout}
                                className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md transform hover:scale-105"
                            >
                                <span className="font-medium">Log Out</span>
                            </button>
                    }
                    {
                        !isAuthenticated && <Link
                            to={'/register'}
                            className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md transform hover:scale-105"
                        >
                            {/* <item?.icon size={20} /> */}
                            <span className="font-medium">Register</span>
                        </Link>
                    }

                    {isAuthenticated && (
                        <div className="flex items-center space-x-2 bg-blue-700 px-4 py-2 rounded-lg shadow-inner">
                            <User size={20} />
                            <span className="text-sm font-light">ID: {userInfo?.name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Navigation Links */}
            <div
                className={`md:hidden mt-4 bg-blue-800 rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="flex flex-col space-y-3 p-4">
                    {navItems.map((item) => (
                        <a
                            key={item?.name}
                            href={item?.href}
                            onClick={() => setIsMobileMenuOpen(false)} // Close menu on link click
                            className="flex items-center space-x-3 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition duration-300 shadow-sm transform hover:translate-x-1"
                        >
                            {/* <item?.icon size={20} /> */}
                            <span className="font-medium">{item?.name}</span>
                        </a>
                    ))}
                    {isAuthenticated && (
                        <div className="flex items-center space-x-3 bg-blue-700 px-4 py-3 rounded-md shadow-inner mt-4">
                            <User size={20} />
                            <span className="text-sm font-light">ID: {userInfo?.username}</span>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
