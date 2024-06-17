import optionService = require("../options");
import myScryptService = require("./my_scrypt");
import utils = require("../utils");
import dataEncryptionService = require("./data_encryption");
import sql = require("../sql");
import sqlInit = require("../sql_init");

function saveSubjectIdentifier(subjectIdentifier: string) {
    const verificationSalt = utils.randomSecureToken(32);
    const derivedKeySalt = utils.randomSecureToken(32);

    console.log("Cycle Start=============================");

    const a = {
        salt: verificationSalt,
        derivedKey: derivedKeySalt,
    };

    const verificationHash =
        myScryptService.getSubjectIdentifierVerificationHash(
            subjectIdentifier,
            a
        );
    if (verificationHash === undefined) {
        console.log("Verification hash undefined!");
        return undefined;
    }

    if (verificationHash !== undefined)
        console.log("Ver type: " + utils.toBase64(verificationHash));

    const userIDEncryptedDataKey = setDataKey(
        subjectIdentifier,
        utils.randomSecureToken(16)
    );

    if (userIDEncryptedDataKey === undefined || userIDEncryptedDataKey === null)
        console.log("USERID ENCRYPTED DATA KEY NULL");

    // console.log("Saving...");
    const data = {
        tmpID: 0,
        userIDVerificationHash: utils.toBase64(verificationHash),
        salt: verificationSalt,
        derivedKey: derivedKeySalt,
        userIDEcnryptedDataKey: userIDEncryptedDataKey,
        isSetup: "true",
    };

    // console.log("Row count: " + sql.getRowOrNull("user_data", 0));
    // console.log(data);
    sql.upsert("user_data", "tmpID", data);

    // sql.replace("user_data", data);
    // console.log("Saved userID");

    // console.log("Current data: " + sql.getMap("user_data"));
    return true;
}

function isSubjectIdentifierSaved() {
    const value = sql.getValue("SELECT userIDEcnryptedDataKey FROM user_data");
    console.log("Val: " + value);
    if (value === undefined || value === null || value === "") return false;
    return true;
}

function isUserSaved() {
    const all = sql.getRows("SELECT * FROM user_data;");
    console.log("All: " + all);
    all.forEach((a, b) => console.log(a, b));
    // const value = sql.execute("SELECT userIDEcnryptedDataKey FROM user_data");
    // console.log("Val: " + value);
    const dbf = sql.getValue<string>("SELECT isSetup FROM user_data;");
    console.log(
        "IsUserSaved: " +
            typeof dbf +
            " - {" +
            dbf +
            "}" +
            " - [" +
            (dbf === "true" ? true : false) +
            "]"
    );
    return dbf === "true" ? true : false;
}

function verifyOpenIDSubjectIdentifier(subjectIdentifier: string) {
    console.log(
        "Verifying UserID+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
    );
    // Check to see if table exists
    if (!sqlInit.isDbInitialized()) {
        console.log("Database not initialized!");
        return undefined;
    }

    if (!isUserSaved()) {
        console.log("DATABASE NOT SETUP");
        return undefined;
    }

    const salt = sql.getValue("SELECT salt FROM user_data;");
    console.log("Salt: " + salt);
    if (salt == undefined) {
        console.log("Salt undefined");
        return undefined;
    }

    const givenSubjectIdentifierHash =
        myScryptService.getSubjectIdentifierVerificationHash(
            utils.toBase64(subjectIdentifier)
        );
    if (givenSubjectIdentifierHash === undefined) {
        console.log("Sub id hash undefined!");
        return undefined;
    }

    console.log(
        "Passed userid Hash: " + utils.toBase64(givenSubjectIdentifierHash)
    );

    const hash = sql.getValue("SELECT userIDVerificationHash FROM user_data");
    if (hash === undefined) {
        console.log("verification hash undefined");
        return undefined;
    }
    console.log("Saved userid Hash: " + hash);

    const dbSubjectIdentifierHash = hash;

    // if (!hash) return false;

    console.log("Given: " + utils.toBase64(givenSubjectIdentifierHash), hash);
    console.log("Matches: " + givenSubjectIdentifierHash === hash);
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
