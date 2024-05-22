/** @format */

'use strict';

import sql = require('../sql');
import optionService = require('../options');
import myScryptService = require('./my_scrypt');
import utils = require('../utils');
import openIDEncryptionService = require('./open_id_encryption');

function saveSubjectIdentifier(options: any, subjectIdentifier: string) {
    if (isSubjectIdentifierSaved()) {
        throw new Error(
            "SubjectIdentifier is set already. Either change it or perform 'reset Subject Identifier' first."
        );
    }
    options.setOption('subjectIdentifierVerificationSalt', utils.randomSecureToken(32), true);
    options.setOption('subjectIdentifierDerivedKeySalt', utils.randomSecureToken(32), true);
    const subjectIdentifierVerificationKey = utils.toBase64(
        myScryptService.getSubjectIdentifierVerificationHash(subjectIdentifier)
    );
    options.setOption('subjectIdentifierVerificationHash', subjectIdentifierVerificationKey, true);

    openIDEncryptionService.setDataKey(subjectIdentifier, utils.randomSecureToken(16));
    options.setOption('userSubjectIdentifierSaved', 'true', true);
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
    saveSubjectIdentifier,
    resetSubjectIdentifier,
    isSubjectIdentifierSaved,
};
