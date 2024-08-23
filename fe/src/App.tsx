import Footer from './components/Navigation/Footer';
import Navbar from './components/Navigation/Navbar';
import Router from './components/Navigation/Router';

function App() {
    return (
        <>
            <Navbar user={null} logo={`${import.meta.env.VITE_APP_LOGO}`} />
            <Router />
            <Footer />
        </>
    );
}

export default App;
