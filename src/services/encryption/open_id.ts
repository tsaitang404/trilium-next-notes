"use strict";

import sql = require("../sql");
import optionService = require("../options");
import myScryptService = require("./my_scrypt");
import utils = require("../utils");
import openIDEncryptionService = require("./open_id_encryption");
import options = require("../options");

function saveSubjectIdentifier(subjectIdentifier: string) {
    const verificationSalt = utils.randomSecureToken(32);
    const derivedKeySalt = utils.randomSecureToken(32);
    const verificationHash = utils.toBase64(
        myScryptService.getSubjectIdentifierVerificationHash(
            subjectIdentifier,
            verificationSalt
        )
    );
    const userIDEncryptedDataKey = openIDEncryptionService.setDataKey(
        subjectIdentifier,
        utils.randomSecureToken(16)
    );

    if (userIDEncryptedDataKey === undefined || userIDEncryptedDataKey === null)
        console.log("USERID ENCRYPTED DATA KEY NULL");

    sql.replace("user_data", {
        userIDVerificationHash: verificationHash,
        userIDVerificationSalt: verificationSalt,
        userIDDerivedKey: derivedKeySalt,
        userIDEcnryptedDataKey: userIDEncryptedDataKey,
        isSetup: "true",
    });

    return {
        success: true,
    };
}

function isSubjectIdentifierSaved() {
    const value = sql.getValue("SELECT userIDEcnryptedDataKey FROM user_data");
    if (value === undefined || value === null || value === "") return false;
    return true;
}

export = {
    saveSubjectIdentifier,
    isSubjectIdentifierSaved,
};
