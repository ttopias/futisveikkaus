import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

import Index from '../Pages/Index';
import Matches from '../Pages/Matches';
import Teams from '../Pages/Teams';
import Standings from '../Pages/Standings';
import Predictions from '../Pages/Predictions';

import { createContext, useContext, useState } from 'react';
import { User } from '../../utils/types';

interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    const login = (user: User) => {
        setUser(user);
    };

    const logout = () => {
        setUser(null);
    };

    const isAdmin = () => {
        return user?.role === 'admin';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};

export function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user, isAdmin } = useAuth();

    if (!user || !isAdmin()) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

function Router() {
    return (
        <main className="container">
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/teams" element={<Teams />} />

                <Route path="/predictions" element={
                    <PrivateRoute>
                        <Predictions />
                    </PrivateRoute>
                } />
                <Route path="/standings" element={
                    <PrivateRoute>
                        <Standings />
                    </PrivateRoute>
                } />
            </Routes>
        </main>
    )
}

export default Router;