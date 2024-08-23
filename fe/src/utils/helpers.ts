export const isAdmin = (role: string) => {
    if (['admin'].includes(role)) return true;
    else return false;
};