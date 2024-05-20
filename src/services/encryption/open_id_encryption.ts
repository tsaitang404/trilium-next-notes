/** @format */

import optionService = require('../options');
import myScryptService = require('./my_scrypt');
import utils = require('../utils');
import dataEncryptionService = require('./data_encryption');
import open_id = require('./open_id');

function verifyOpenIDSubjectIdentifier(password: string) {
    if (!optionService.getOptionBool('userSubjectIdentifierSaved')) return false;

    const givenSubjectIdentifierHash = utils.toBase64(myScryptService.getSubjectIdentifierVerificationHash(password));

    const dbSubjectIdentifierHash = optionService.getOptionOrNull('subjectIdentifierVerificationHash');

    if (!dbSubjectIdentifierHash) {
        return false;
    }
    console.log('HERE');
    console.log(givenSubjectIdentifierHash === dbSubjectIdentifierHash);

    return givenSubjectIdentifierHash === dbSubjectIdentifierHash;
}

function setDataKey(subjectIdentifier: string, plainTextDataKey: string | Buffer) {
    const subjectIdentifierDerivedKey = myScryptService.getSubjectIdentifierDerivedKey(subjectIdentifier);

    const newEncryptedDataKey = dataEncryptionService.encrypt(subjectIdentifierDerivedKey, plainTextDataKey);

    optionService.setOption('subjectIdentifierEncryptedDataKey', newEncryptedDataKey);
}

function getDataKey(subjectIdentifier: string) {
    const subjectIdentifierDerivedKey = myScryptService.getSubjectIdentifierDerivedKey(subjectIdentifier);

    const encryptedDataKey = optionService.getOption('subjectIdentifierEncryptedDataKey');

    const decryptedDataKey = dataEncryptionService.decrypt(subjectIdentifierDerivedKey, encryptedDataKey);

    return decryptedDataKey;
}

export = {
    verifyOpenIDSubjectIdentifier,
    getDataKey,
    setDataKey,
};
