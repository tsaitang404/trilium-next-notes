/** @format */

import OpenIDError = require('../errors/open_id_error');
import {NextFunction, Request, Response} from 'express';
import openIDService = require('./encryption/open_id');
import openIDEncryptionService = require('./encryption/open_id_encryption');
import options = require('./options');

function isOpenIDEnabled() {
    if (process.env.ENABLE_OAUTH?.toLocaleLowerCase() !== 'true') return false;

    try {
        return options.getOptionBool('oAuthEnabled');
    } catch (e) {
        return false;
    }
}

function checkOpenIDRequirements() {
    if (!isOpenIDEnabled()) return false;
    if (process.env.BASE_URL === undefined) throw new OpenIDError('BASE_URL is undefined in .env!');
    if (process.env.CLIENT_ID === undefined) throw new OpenIDError('CLIENT_ID is undefined in .env!');
    if (process.env.ISSUER_BASE_URL === undefined) throw new OpenIDError('ISSUER_BASE_URL is undefined in .env!');
    if (process.env.SECRET === undefined) throw new OpenIDError('SECRET is undefined in .env!');

    return true;
}

function enableOAuth() {
    options.setOption('oAuthEnabled', true);
    options.setOption('totpEnabled', false);

    return {success: true, message: 'OAuth Enabled'};
}

function disableOAuth() {
    options.setOption('oAuthEnabled', false);
    return {success: true, message: 'OAuth Disabled'};
}

function getOAuthStatus() {
    return {success: true, message: options.getOptionBool('oAuthEnabled')};
}

async function verifySubId(req: Request, res: Response, next: NextFunction) {
    req.oidc.fetchUserInfo().then((result) => {
        return {success: true, result: openIDEncryptionService.verifyOpenIDSubjectIdentifier(result.sub)};
    });
}

function authenticateUser(req: Request, res: Response, next: NextFunction) {
    if (openIDService.isSubjectIdentifierSaved()) return {success: false, message: 'User ID already saved!'};
    if (!req.oidc.user) {
        res.redirect('/auth');
    }

    req.oidc.fetchUserInfo().then((result) => {
        openIDService.saveSubjectIdentifier(result.sub);
    });
    return {success: true, message: 'User ' + req.oidc.user?.sub + ' saved!'};
}

export = {
    getOAuthStatus,
    enableOAuth,
    disableOAuth,
    isOpenIDEnabled,
    checkOpenIDRequirements,
    verifySubId,
    authenticateUser,
};
