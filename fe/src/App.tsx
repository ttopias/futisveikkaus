import { Routes, Route } from 'react-router-dom';

import { Index } from './components/Pages/Index';
import Footer from './components/Navigation/Footer';
import Navbar from './components/Navigation/Navbar';

function App() {
    return (
        <>
            <Navbar user={null} logo={`${import.meta.env.VITE_APP_LOGO}`} />
            <Routes>
                <Route path="/" element={<Index />} />
            </Routes>
            <Footer />
        </>
    );
}

export default App;
