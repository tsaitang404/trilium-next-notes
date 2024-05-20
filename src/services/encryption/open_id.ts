/** @format */

'use strict';

import sql = require('../sql');
import optionService = require('../options');
import myScryptService = require('./my_scrypt');
import utils = require('../utils');
import openIDEncryptionService = require('./open_id_encryption');

function isSubjectIdentifierSet() {
    return !!sql.getValue("SELECT value FROM options WHERE name = 'subjectIdentifierVerificationHash'");
}

// function changeSubjectIdentifier(currentSubjectIdentifier: string, newPassword: string) {
//     if (!isSubjectIdentifierSet()) {
//         throw new Error("Password has not been set yet, so it cannot be changed. Use 'setPassword' instead.");
//     }

//     if (!passwordEncryptionService.verifyPassword(currentSubjectIdentifier)) {
//         return {
//             success: false,
//             message: "Given current password doesn't match hash",
//         };
//     }

//     sql.transactional(() => {
//         const decryptedDataKey = passwordEncryptionService.getDataKey(currentSubjectIdentifier);

//         optionService.setOption('passwordVerificationSalt', utils.randomSecureToken(32));
//         optionService.setOption('passwordDerivedKeySalt', utils.randomSecureToken(32));

//         const newPasswordVerificationKey = utils.toBase64(myScryptService.getVerificationHash(newPassword));

//         if (decryptedDataKey) {
//             // TODO: what should happen if the decrypted data key is null?
//             passwordEncryptionService.setDataKey(newPassword, decryptedDataKey);
//         }

//         optionService.setOption('passwordVerificationHash', newPasswordVerificationKey);
//     });

//     return {
//         success: true,
//     };
// }

function createSubjectIdentifier(options: any, subjectIdentifier: string) {
    if (isSubjectIdentifierSet()) {
        throw new Error(
            "SubjectIdentifier is set already. Either change it or perform 'reset Subject Identifier' first."
        );
    }
    console.log('FDFFF');
    options.createOption('subjectIdentifierVerificationSalt', utils.randomSecureToken(32), true);
    options.createOption('subjectIdentifierDerivedKeySalt', utils.randomSecureToken(32), true);
    const subjectIdentifierVerificationKey = utils.toBase64(myScryptService.getVerificationHash(subjectIdentifier));
    options.createOption('subjectIdentifierVerificationHash', subjectIdentifierVerificationKey, true);

    // passwordEncryptionService expects these options to already exist
    options.createOption('subjectIdentifierEncryptedDataKey', '', true);
    openIDEncryptionService.setDataKey(subjectIdentifier, utils.randomSecureToken(16));
    return {
        success: true,
    };
}

function resetSubjectIdentifier() {
    // user forgot the subjectIdentifier,
    sql.transactional(() => {
        optionService.setOption('subjectIdentifierVerificationSalt', '');
        optionService.setOption('subjectIdentifierDerivedKeySalt', '');
        optionService.setOption('subjectIdentifierEncryptedDataKey', '');
        optionService.setOption('subjectIdentifierVerificationHash', '');
    });

    return {
        success: true,
    };
}

function isSubjectIdentifierSaved() {
    return optionService.getOptionBool('userSubjectIdentifierSaved');
}

export = {
    isSubjectIdentifierSet,
    // changeSubjectIdentifier,
    createSubjectIdentifier,
    resetSubjectIdentifier,
    isSubjectIdentifierSaved,
};
