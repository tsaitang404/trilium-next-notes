import optionService = require("../options");
import myScryptService = require("./my_scrypt");
import utils = require("../utils");
import dataEncryptionService = require("./data_encryption");
import sql = require("../sql");
import sqlInit = require("../sql_init");

function saveSubjectIdentifier(subjectIdentifier: string) {
    const verificationSalt = utils.randomSecureToken(32);
    const derivedKeySalt = utils.randomSecureToken(32);

    sql.replace("user_data", {
        userIDVerificationSalt: verificationSalt,
        userIDDerivedKeySalt: derivedKeySalt,
    });

    const verificationHash =
        myScryptService.getSubjectIdentifierVerificationHash(subjectIdentifier);

    const userIDEncryptedDataKey = setDataKey(
        subjectIdentifier,
        utils.randomSecureToken(16)
    );

    if (userIDEncryptedDataKey === undefined || userIDEncryptedDataKey === null)
        console.log("USERID ENCRYPTED DATA KEY NULL");

    console.log("Saving...");
    const data = {
        userIDVerificationHash: verificationHash,
        userIDVerificationSalt: verificationSalt,
        userIDDerivedKey: derivedKeySalt,
        userIDEcnryptedDataKey: userIDEncryptedDataKey,
        isSetup: "true",
    };

    console.log(data);
    sql.replace("user_data", data);
    console.log("Saved userID");
    return {
        success: true,
    };
}

function isSubjectIdentifierSaved() {
    const value = sql.getValue("SELECT userIDEcnryptedDataKey FROM user_data");
    if (value === undefined || value === null || value === "") return false;
    return true;
}

function isUserSaved() {
    return sql.getValue("SELECT isSetup FROM user_data") == "true"
        ? true
        : false;
}

function verifyOpenIDSubjectIdentifier(subjectIdentifier: string) {
    console.log("Verifying UserID");
    // Check to see if table exists
    if (!sqlInit.isDbInitialized()) return undefined;

    if (!isUserSaved()) {
        console.log("DATABASE NOT SETUP");
        return undefined;
    }

    const salt = sql.getValue("SELECT userIDVerificationSalt FROM user_data");
    console.log("Salt: " + salt);
    if (salt == undefined) {
        console.log("Salt undefined");
        return undefined;
    }

    const givenSubjectIdentifierHash =
        myScryptService.getSubjectIdentifierVerificationHash(
            utils.toBase64(subjectIdentifier)
        );

    console.log(
        "Passed userid Hash: " + givenSubjectIdentifierHash?.toString("base64")
    );

    const hash = sql.getValue("SELECT userIDVerificationHash FROM user_data");
    if (hash === undefined) {
        console.log("verification hash undefined");
        return undefined;
    }
    console.log("Saved userid Hash: " + hash);

    const dbSubjectIdentifierHash = hash;

    // if (!hash) return false;

    console.log(givenSubjectIdentifierHash, hash);
    console.log("Matches: " + givenSubjectIdentifierHash === hash);
    console.log(givenSubjectIdentifierHash);
    console.log("Hash 2: " + hash);
    return givenSubjectIdentifierHash === hash;
}

function setDataKey(
    subjectIdentifier: string,
    plainTextDataKey: string | Buffer
) {
    // Need to figure out which salt. Don't have the brain power for encryption today.
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

    const encryptedDataKey = sql.getValue(
        "SELECT userIDEcnryptedDataKey FROM user_data"
    );

    if (encryptedDataKey === undefined || encryptedDataKey === null) {
        console.log("Encrypted data key empty!");
        return undefined;
    }

    if (subjectIdentifierDerivedKey === undefined) {
        console.log("SOMETHING WENT WRONG SAVING USER ID DERIVED KEY");
        return undefined;
    }
    const decryptedDataKey = dataEncryptionService.decrypt(
        subjectIdentifierDerivedKey,
        encryptedDataKey.toString()
    );

    return decryptedDataKey;
}

export = {
    verifyOpenIDSubjectIdentifier,
    getDataKey,
    setDataKey,
    saveSubjectIdentifier,
    isSubjectIdentifierSaved,
};
