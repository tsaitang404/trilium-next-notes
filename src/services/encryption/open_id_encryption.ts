import optionService = require("../options");
import myScryptService = require("./my_scrypt");
import utils = require("../utils");
import dataEncryptionService = require("./data_encryption");
import sql = require("../sql");
import sqlInit = require("../sql_init");

function verifyOpenIDSubjectIdentifier(subjectIdentifier: string) {
    // Check to see if table exists
    if (!sqlInit.isDbInitialized()) return undefined;

    const data = sql.getValue("SELECT isSetup FROM user_data");
    if (data !== "true") {
        console.log("DATABASE NOT SETUP");
        return undefined;
    }

    // if (!optionService.getOptionBool("userSubjectIdentifierSaved")) {
    //     return false;
    // }

    console.log("DKDKDKDK");
    const salt = sql.getValue("SELECT userIDVerificationSalt FROM user_data");
    console.log(salt);
    if (salt == undefined) return undefined;

    const givenSubjectIdentifierHash = utils.toBase64(
        myScryptService.getSubjectIdentifierVerificationHash(
            subjectIdentifier,
            utils.toBase64(salt.toString())
        )
    );

    const hash = sql.getValue("SELECT userIDVerificationHash FROM user_data");
    if (hash === undefined) return undefined;

    const dbSubjectIdentifierHash = hash;

    if (!hash) return false;

    console.log("Matches: " + givenSubjectIdentifierHash === hash);
    console.log(givenSubjectIdentifierHash);
    console.log(hash);
    return givenSubjectIdentifierHash === hash;
}

function setDataKey(
    subjectIdentifier: string,
    plainTextDataKey: string | Buffer
) {
    const subjectIdentifierDerivedKey =
        myScryptService.getSubjectIdentifierDerivedKey(subjectIdentifier);

    if (subjectIdentifierDerivedKey === undefined) {
        console.log("SOMETHING WENT WRONG SAVING USER ID DERIVED KEY");
        return undefined;
    }
    const newEncryptedDataKey = dataEncryptionService.encrypt(
        subjectIdentifierDerivedKey,
        plainTextDataKey
    );

    // optionService.setOption('subjectIdentifierEncryptedDataKey', newEncryptedDataKey);
    return newEncryptedDataKey;
}

function getDataKey(subjectIdentifier: string) {
    const subjectIdentifierDerivedKey =
        myScryptService.getSubjectIdentifierDerivedKey(subjectIdentifier);

    const encryptedDataKey = optionService.getOption(
        "subjectIdentifierEncryptedDataKey"
    );

    if (subjectIdentifierDerivedKey === undefined) {
        console.log("SOMETHING WENT WRONG SAVING USER ID DERIVED KEY");
        return undefined;
    }
    const decryptedDataKey = dataEncryptionService.decrypt(
        subjectIdentifierDerivedKey,
        encryptedDataKey
    );

    return decryptedDataKey;
}

export = {
    verifyOpenIDSubjectIdentifier,
    getDataKey,
    setDataKey,
};
