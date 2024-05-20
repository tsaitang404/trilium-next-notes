/** @format */

'use strict';

import {NextFunction, Request, Response} from 'express';
import {AppRequest} from '../../routes/route-interface';
import openIDService = require('../encryption/open_id');
import openIDEncryptionService = require('../encryption/open_id_encryption');
import open_id = require('../open_id');
import options = require('../options');

async function pass() {
    // await openIDService.setSubjectIdentifier('req.oidc.user?.sub');
}

function authCallback(req: AppRequest, res: Response, next: NextFunction) {
    console.log('CALLBACK');

    console.log('Checking to see if [' + req.oidc.user?.name + '] is logged in');
    if (!req.app.locals.userSubjectIdentifierSaved) {
        req.session.loggedIn = true;
        console.log('USER IS NOT SET! NEED TO SET!');
    } else {
        if (req.app.locals.userAuthenticated) req.session.loggedIn = true;
        else req.session.loggedIn = false;
    }
    next();
}

function callback(req: Request, res: Response, next: NextFunction) {
    console.log('CALLBACK FINALLY');
}

function logoutOfOidc(req: Request, res: Response, next: NextFunction) {
    // res.oidc.logout({returnTo: "http://localhost:8080/info"})
    res.redirect('info');
}
function explain(req: Request, res: Response, next: NextFunction) {
    if (open_id.isOpenIDEnabled()) {
        if (req.oidc.isAuthenticated()) {
            req.oidc.fetchUserInfo().then((result) => {
                console.log(result.sub);
            });
            // res.send(req.oidc.user?.name);
            return {success: true, data: req.oidc.user};
        } else res.send('User is not logged in');
    } else res.send('OIDC Not enabled');
}

function postAuth(req: Request, res: Response, next: NextFunction) {
    if (!open_id.isOpenIDEnabled()) next();

    if (!req.oidc.isAuthenticated()) next;

    // req.session.
}

function verifySubId(req: Request, res: Response, next: NextFunction) {
    req.oidc.fetchUserInfo().then((result) => {
        return {success: true, result: openIDEncryptionService.verifyOpenIDSubjectIdentifier(result.sub)};
    });
}

function check(req: Request, res: Response, next: NextFunction) {
    return {success: true, message: openIDService.isSubjectIdentifierSet()};
}

function login(req: Request, res: Response, next: NextFunction) {
    if (openIDService.isSubjectIdentifierSaved()) return {success: false, message: 'User ID already saved!'};
    if (!req.oidc.user) return {success: false, message: 'User not logged in!'};

    openIDService.createSubjectIdentifier(options, req.oidc.user?.sub);
    console.log('User Sub saved!');
    return {success: true, message: 'User ' + req.oidc.user.sub + ' saved!'};
}

export = {
    explain,
    authCallback,
    postAuth,
    callback,
    logoutOfOidc,
    verifySubId,
    login,
    check,
};
