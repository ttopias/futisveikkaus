import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isAdmin } from '../../utils/helpers';
import { User } from '../../utils/types';
import MenuLink from './MenuLink';
import MobileMenu from './MobileMenu';

interface NavbarProps {
    user: User | null;
    logo: string;
}

function Navbar({ user, logo }: NavbarProps) {
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const role = user?.role || '';

    return (
        <nav>
            <div>
                <div>
                    <div>
                        <a href="/">
                            <button
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <img src={logo} alt='app-logo' />
                                <span>
                                    {import.meta.env.VITE_APP_NAME}
                                </span>
                            </button>
                        </a>

                        <div>
                            <MenuLink href="/" label={t('navbar.home')} currentPath="/" />
                            <MenuLink href="/matches" label={t('navbar.matches')} currentPath="/matches" />
                            <MenuLink href="/teams" label={t('navbar.teams')} currentPath="/teams" />
                            {user && (
                                <>
                                    <MenuLink href="/predictions?create" label={t('navbar.predictions')} currentPath="/predictions" />
                                    <MenuLink href="/standings" label={t('navbar.standings')} currentPath="/standings" />
                                </>
                            )}
                        </div>

                        {isAdmin(role) && (
                            <div>
                                <MenuLink href="/admin/matches" label={t('navbar.matches')} currentPath="/admin/matches" />
                                <MenuLink href="/admin/teams" label={t('navbar.teams')} currentPath="/admin/teams" />
                                <MenuLink href="/admin/guesses" label={t('navbar.predictions')} currentPath="/admin/guesses" />
                            </div>
                        )}

                        <div>
                            {user ? (
                                <MenuLink href="/profile" label="X" currentPath="/profile" />
                            ) : (
                                <a href="/auth">{t('navbar.login')}</a>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="sm:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <span>Open main menu</span>
                                {!isMenuOpen ? (
                                    <svg
                                        className="block h-6 w-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="block h-6 w-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <MobileMenu
                isOpen={isMenuOpen}
                toggleMenu={() => setIsMenuOpen(!isMenuOpen)}
                user={user}
                isAdmin={isAdmin(role)}
            />
        </nav>
    );
};

export default Navbar;
