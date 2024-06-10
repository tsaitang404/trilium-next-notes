"use strict";

import sql = require("../sql");
import optionService = require("../options");
import myScryptService = require("./my_scrypt");
import utils = require("../utils");
import openIDEncryptionService = require("./open_id_encryption");
import options = require("../options");

function saveSubjectIdentifier(subjectIdentifier: string) {
    // if (isSubjectIdentifierSaved()) {
    //     throw new Error(
    //         "SubjectIdentifier is set already. Either change it or perform 'reset Subject Identifier' first."
    //     );
    // }

    // sql.replace("user_data", {
    //     userID: subjectIdentifier,
    // });

    // sql.replace("user_data", {
    //     userID: subjectIdentifier,
    // });

    const verificationSalt = utils.randomSecureToken(32);
    const derivedKeySalt = utils.randomSecureToken(32);
    const verificationHash = utils.toBase64(
        myScryptService.getSubjectIdentifierVerificationHash(subjectIdentifier)
    );
    const userIDEncryptedDataKey = openIDEncryptionService.setDataKey(
        subjectIdentifier,
        utils.randomSecureToken(16)
    );

    sql.replace("user_data", {
        userIDVerificationHash: verificationHash,
        userIDVerificationSalt: verificationSalt,
        userIDDerivedKey: derivedKeySalt,
        userIDEcnryptedDataKey: userIDEncryptedDataKey,
    });
    // if (userID === sql.getValue("SELECT * FROM user_data"))

    // options.setOption('subjectIdentifierVerificationSalt', utils.randomSecureToken(32));
    // options.setOption('subjectIdentifierDerivedKeySalt', utils.randomSecureToken(32));
    // const subjectIdentifierVerificationKey = utils.toBase64(
    //     myScryptService.getSubjectIdentifierVerificationHash(subjectIdentifier)
    // );
    // options.setOption('subjectIdentifierVerificationHash', subjectIdentifierVerificationKey);

    // openIDEncryptionService.setDataKey(subjectIdentifier, utils.randomSecureToken(16));
    // options.setOption('userSubjectIdentifierSaved', 'true');
    return {
        success: true,
    };
}

// function resetSubjectIdentifier() {
//     // user forgot the subjectIdentifier,
//     sql.transactional(() => {
//         optionService.setOption("subjectIdentifierVerificationSalt", "");
//         optionService.setOption("subjectIdentifierDerivedKeySalt", "");
//         optionService.setOption("subjectIdentifierEncryptedDataKey", "");
//         optionService.setOption("subjectIdentifierVerificationHash", "");
//     });

//     return {
//         success: true,
//     };
// }

function isSubjectIdentifierSaved() {
    const value = sql.getValue("SELECT userIDEcnryptedDataKey FROM user_data");
    if (value === undefined || value === null || value === "") return false;
    return true;
}

export = {
    saveSubjectIdentifier,
    // resetSubjectIdentifier,
    isSubjectIdentifierSaved,
};
