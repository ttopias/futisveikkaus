function Footer() {
    return (
        <footer className="p-4 shadow-2xl">
            <div className="flex justify-between items-center">
                <a href="https://github.com/ttopias" target="_blank">
                    <p>© {new Date().getFullYear()}</p>
                </a>
            </div>
        </footer>
    );
}

export default Footer;