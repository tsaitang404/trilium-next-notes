'use strict';

import sql = require('../sql');
import optionService = require('../options');
import myScryptService = require('./my_scrypt');
import utils = require('../utils');
import totpEncryptionService = require('./totp_secret_encryption');
import {Totp} from 'time2fa';

function isTotpSecretSet() {
    return !!sql.getValue("SELECT value FROM options WHERE name = 'passwordVerificationHash'");
}

function setTotpSecret(secret: string) {
    if (isTotpSecretSet()) {
        throw new Error("TOTP Secret is set already. Either change it or perform 'reset TOTP' first.");
    }

    optionService.setOption('totpSecretVerificationSalt', utils.randomSecureToken(32));
    optionService.setOption('totpSecretDerivedKeySalt', utils.randomSecureToken(32));

    const totpSecretVerificationKey = utils.toBase64(myScryptService.getTotpSecretVerificationHash(secret));
    optionService.setOption('totpSecretVerificationHash', totpSecretVerificationKey);

    optionService.setOption('encryptedTotpSecretDataKey', '');

    totpEncryptionService.setDataKey(secret, utils.randomSecureToken(16));

    return {
        success: true
    };
}

function validateTOTP(guessedPasscode: string) {
    if (process.env.TOTP_SECRET === undefined) return false;

    try {
        const valid = Totp.validate({
            passcode: guessedPasscode,
            secret: process.env.TOTP_SECRET.trim()
        });
        return valid;
    } catch (e) {
        return false;
    }
}

export = {
    isTotpSecretSet,
    setTotpSecret,
    validateTOTP
};
