/** @format */

'use strict';

import {NextFunction, Request, Response} from 'express';
import {AppRequest} from '../../routes/route-interface';
import openIDService = require('../encryption/open_id');
import openIDEncryptionService = require('../encryption/open_id_encryption');
import open_id = require('../open_id');
import options = require('../options');

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

async function verifySubId(req: Request, res: Response, next: NextFunction) {
    console.log('Checking....');

    req.oidc.fetchUserInfo().then((result) => {
        console.log(result);
        const isIn = openIDEncryptionService.verifyOpenIDSubjectIdentifier(result.sub);

        console.log(isIn);
        res.locals.flig = true;
        return {success: true, result: isIn};
    });
}

function check(req: Request, res: Response, next: NextFunction) {
    return {success: true, message: openIDService.isSubjectIdentifierSaved()};
}

function login(req: Request, res: Response, next: NextFunction) {
    if (openIDService.isSubjectIdentifierSaved()) return {success: false, message: 'User ID already saved!'};
    if (!req.oidc.user) return {success: false, message: 'User not logged in!'};

    openIDService.saveSubjectIdentifier(options, req.oidc.user?.sub);
    console.log('User Sub saved!');
    return {success: true, message: 'User ' + req.oidc.user.sub + ' saved!'};
}

export = {
    explain,
    postAuth,
    verifySubId,
    login,
    check,
};
