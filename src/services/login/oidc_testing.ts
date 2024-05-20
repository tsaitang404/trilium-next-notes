/** @format */

'use strict';

import {NextFunction, Request, Response} from 'express';
import {AppRequest} from '../../routes/route-interface';
import openIDService = require('../encryption/open_id');
import openIDEncryptionService = require('../encryption/open_id_encryption');
import open_id = require('../open_id');
import options = require('../options');

async function pass() {
    await openIDService.setSubjectIdentifier('req.oidc.user?.sub');
}

function authCallback(req: AppRequest, res: Response, next: NextFunction) {
    console.log('CALLBACK');

    // if (!openIDService.isSubjectIdentifierSet()) {
    req.session.loggedIn = true;
    // req.app.locals.firstLogin = true;
    next();
    // } else {
    //     console.log('Verifying user: ' + openIDEncryptionService.verifyOpenIDSubjectIdentifier(req.oidc.user?.sub));
    //     next();
    // }

    // next();

    // req.oidc.fetchUserInfo().then((result) => {
    //     if (openIDEncryptionService.verifyOpenIDSubjectIdentifier(result.sub)) {
    //         req.session.loggedIn = true;
    //         next();
    //     }
    // });

    // res.redirect('/auth-failed');
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
            res.send(req.oidc.user?.name);
        } else res.send('User is not logged in');
    } else res.send('OIDC Not enabled');
}

function postAuth(req: Request, res: Response, next: NextFunction) {
    if (!open_id.isOpenIDEnabled()) next();

    if (!req.oidc.isAuthenticated()) next;

    // req.session.
}

export = {
    explain,
    authCallback,
    postAuth,
    callback,
    logoutOfOidc,
};
