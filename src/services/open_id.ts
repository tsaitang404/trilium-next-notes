/** @format */

import OpenIDError = require('../errors/open_id_error');

function isOpenIDEnabled() {
    if (process.env.ENABLE_OAUTH?.toLocaleLowerCase() === 'true') return true;
    return false;
}

function checkOpenIDRequirements() {
    if (!isOpenIDEnabled()) return false;
    if (process.env.BASE_URL === undefined) throw new OpenIDError('BASE_URL is undefined in .env!');
    if (process.env.CLIENT_ID === undefined) throw new OpenIDError('CLIENT_ID is undefined in .env!');
    if (process.env.ISSUER_BASE_URL === undefined) throw new OpenIDError('ISSUER_BASE_URL is undefined in .env!');
    if (process.env.SECRET === undefined) throw new OpenIDError('SECRET is undefined in .env!');

    return true;
}

export = {
    isOpenIDEnabled,
    checkOpenIDRequirements,
};
