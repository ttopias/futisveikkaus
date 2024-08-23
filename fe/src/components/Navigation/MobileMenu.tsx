import { useTranslation } from "react-i18next";
import MenuLink from "./MenuLink";
import { User } from "../../utils/types";

interface MobileMenuProps {
    isOpen: boolean;
    toggleMenu: () => void;
    user: User | null;
    isAdmin: boolean;
}

function MobileMenu({ isOpen, toggleMenu, user, isAdmin }: MobileMenuProps) {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="bg-accent text-accent-content sm:hidden mt-2 rounded-btn" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 mx-2">
                <MenuLink href="/" label={t('navbar.home')} currentPath="/" onClick={toggleMenu} />
                <div className="divider divider-neutral opacity-25 py-4" />
                <MenuLink href="/matches" label={t('navbar.matches')} currentPath="/matches" onClick={toggleMenu} />
                <div className="divider divider-neutral opacity-25 py-4" />
                <MenuLink href="/teams" label={t('navbar.teams')} currentPath="/teams" onClick={toggleMenu} />

                {user && (
                    <>
                        <div className="divider divider-neutral opacity-25 py-4" />
                        <MenuLink
                            href="/predictions?create"
                            label={t('navbar.predictions')}
                            currentPath="/predictions"
                            onClick={toggleMenu}
                        />
                        <div className="divider divider-neutral opacity-25 py-4" />
                        <MenuLink href="/standings" label={t('navbar.standings')} currentPath="/standings" onClick={toggleMenu} />
                        <div className="divider divider-neutral opacity-25 py-4" />
                        <MenuLink href="/profile" label={t('navbar.profile')} currentPath="/profile" onClick={toggleMenu} />
                        <div className="divider divider-neutral opacity-25 py-4" />
                        <MenuLink
                            href="/standings"
                            label={
                                <span className="w-full flex items-center">
                                    {t('navbar.logout')}
                                </span>
                            }
                            currentPath="/standings"
                            onClick={toggleMenu}
                        />
                    </>
                )}

                {isAdmin && (
                    <>
                        <div className="divider divider-neutral opacity-25 py-4" />
                        <MenuLink href="/admin/matches" label={t('navbar.matches')} currentPath="/admin/matches" onClick={toggleMenu} />
                        <MenuLink href="/admin/teams" label={t('navbar.teams')} currentPath="/admin/teams" onClick={toggleMenu} />
                        <MenuLink href="/admin/guesses" label={t('navbar.predictions')} currentPath="/admin/guesses" onClick={toggleMenu} />
                    </>
                )}

                {!user && (
                    <div className="flex items-center space-x-4">
                        <a href="/auth" onClick={toggleMenu}>
                            <button type="button" className="btn btn-primary my-6">{t('navbar.login')}</button>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileMenu;
