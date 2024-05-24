/** @format */

import options = require('../../services/options');
const speakeasy = require('speakeasy');

function generateSecret() {
    return {success: 'true', message: speakeasy.generateSecret().base32};
}

function getTOTPStatus() {
    const totpEnabled = options.getOptionBool('totpEnabled');
    return {success: 'true', message: totpEnabled};
}

function enableTOTP() {
    options.setOption('totpEnabled', true);
    options.setOption('oAuthEnabled', false);
    return {success: 'true'};
}

function disableTOTP() {
    options.setOption('totpEnabled', false);
    return {success: true};
}

function getSecret() {
    return process.env.TOTP_SECRET;
}

export = {
    generateSecret,
    getTOTPStatus,
    enableTOTP,
    disableTOTP,
    getSecret,
};
