/** @format */

import OpenIDError = require('../errors/open_id_error');
import {NextFunction, Request, Response} from 'express';
import openIDService = require('./encryption/open_id');
import openIDEncryptionService = require('./encryption/open_id_encryption');
import options = require('./options');

function isOpenIDEnabled() {
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
    if (process.env.AUTH_0_LOGOUT === undefined) throw new OpenIDError('AUTH_0_LOGOUT is undefined in .env!');

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

function authenticateUser(req: Request, res: Response, next: NextFunction) {
    // TODO: Add validity
    if (openIDService.isSubjectIdentifierSaved()) return {success: false, message: 'User ID already saved!'};

    if (req.oidc !== undefined) {
        console.log('Access token valid!');
        console.log(req.oidc.accessToken);
    } else {
        console.log('Access token Invalid!');
        res.redirect('http://localhost:8080/auth');
        // req.oidc.accessToken.refresh().then((result) => {
        //     console.log('Refreshed');
        //     console.log(result);
        // });
    }

    req.oidc.fetchUserInfo().then((result) => {
        openIDService.saveSubjectIdentifier(result.sub);
    });
    return {success: true, message: 'User ' + req.oidc.user?.sub + ' saved!'};
}

function checkAuth0Logout() {
    if (process.env.AUTH_0_LOGOUT === undefined) return false;
    if (process.env.AUTH_0_LOGOUT.toLocaleLowerCase() === 'true') return true;
    return false;
}

function generateOAuthConfig() {
    const authRoutes = {
        callback: '/callback',
        login: '/auth',
        postLogoutRedirect: '/login',
        logout: '/logout',
    };

    const logoutParams = {
        end_session_endpoint: '/end-session/',
    };

    const authConfig = {
        authRequired: true,
        auth0Logout: checkAuth0Logout(),
        baseURL: process.env.BASE_URL,
        clientID: process.env.CLIENT_ID,
        issuerBaseURL: process.env.ISSUER_BASE_URL,
        secret: process.env.SECRET,
        clientSecret: process.env.SECRET,
        // authorizationParams: {
        //     response_type: 'code',
        //     scope: 'openid profile email read:reports',
        // },
        routes: authRoutes,
        idpLogout: true,
        logoutParams: logoutParams,
    };
    return authConfig;
}

export = {
    generateOAuthConfig,
    getOAuthStatus,
    enableOAuth,
    disableOAuth,
    isOpenIDEnabled,
    checkOpenIDRequirements,
    authenticateUser,
};
