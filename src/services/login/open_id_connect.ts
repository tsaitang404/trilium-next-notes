/** @format */

'use strict';

import {NextFunction, Request, Response} from 'express';
// This entire file is boilerplate from https://www.npmjs.com/package/openid-client

import {Issuer, Strategy} from 'openid-client';
import {generators} from 'openid-client';
const {auth, requiresAuth} = require('express-openid-connect');

const code_verifier = generators.codeVerifier();
// store the code_verifier in your framework's session mechanism, if it is a cookie based solution
// it should be httpOnly (not readable by javascript) and encrypted.

async function login() {
    const googleIssuer = await Issuer.discover(
        'https://auth.mauldin314.com/application/o/trilium/.well-known/openid-configuration'
    );
    const nonce = generators.nonce();
    console.log('Discovered issuer %s %O', googleIssuer.issuer, googleIssuer.metadata);

    const client = new googleIssuer.Client({
        client_id: 'utqV1OgVM9wiCL9rfk92a84pkQs2CpvzBkSdrXF4',
        redirect_uris: ['http://localhost:8080/callback'],
        response_types: ['id_token'],
        // id_token_signed_response_alg (default "RS256")
        // token_endpoint_auth_method (default "client_secret_basic")
    }); // => Client

    let a = new Strategy({client, passReqToCallback: true}, (req, tokenSet, userinfo, done) => {
        console.log('tokenSet', tokenSet);
        console.log('userinfo', userinfo);
    });

    //     const code_challenge = generators.codeChallenge(code_verifier);

    //     client.authorizationUrl({
    //         scope: 'openid email profile',
    //         resource: 'https://auth.mauldin314.com/application/o/authorize/',
    //         nonce,
    //     });
    // }
}

function authenticate(req: Request, res: Response) {
    console.log('AHHHH');
    // res.send(JSON.stringify(req.oidc.user, null, 2));
}

function preAuth(req: Request, res: Response, next: NextFunction) {
    console.log('DKKDKDK');
    requiresAuth();
    next;
}

export = {
    authenticate,
    login,
    preAuth,
};
