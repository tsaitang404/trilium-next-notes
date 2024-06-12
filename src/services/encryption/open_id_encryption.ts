import optionService = require("../options");
import myScryptService = require("./my_scrypt");
import utils = require("../utils");
import dataEncryptionService = require("./data_encryption");
import sql = require("../sql");
import sqlInit = require("../sql_init");

function saveSubjectIdentifier(subjectIdentifier: string) {
  const verificationSalt = utils.randomSecureToken(32);
  const derivedKeySalt = utils.randomSecureToken(32);
  const verificationHash = utils.toBase64(myScryptService.getSubjectIdentifierVerificationHash(subjectIdentifier, verificationSalt));
  const userIDEncryptedDataKey = setDataKey(subjectIdentifier, utils.randomSecureToken(16), derivedKeySalt);

  if (userIDEncryptedDataKey === undefined || userIDEncryptedDataKey === null) console.log("USERID ENCRYPTED DATA KEY NULL");

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

function isUserSaved() {
  return sql.getValue("SELECT isSetup FROM user_data") == "true" ? true : false;
}

function verifyOpenIDSubjectIdentifier(subjectIdentifier: string) {
  // Check to see if table exists
  if (!sqlInit.isDbInitialized()) return undefined;

  if (!isUserSaved()) {
    console.log("DATABASE NOT SETUP");
    return undefined;
  }

  const salt = sql.getValue("SELECT userIDVerificationSalt FROM user_data");
  console.log(salt);
  if (salt == undefined) return undefined;

  const givenSubjectIdentifierHash = utils.toBase64(myScryptService.getSubjectIdentifierVerificationHash(subjectIdentifier, utils.toBase64(salt.toString())));

  const hash = sql.getValue("SELECT userIDVerificationHash FROM user_data");
  if (hash === undefined) return undefined;

  const dbSubjectIdentifierHash = hash;

  if (!hash) return false;

  console.log("Matches: " + givenSubjectIdentifierHash === hash);
  console.log(givenSubjectIdentifierHash);
  console.log(hash);
  return givenSubjectIdentifierHash === hash;
}

function setDataKey(subjectIdentifier: string, plainTextDataKey: string | Buffer, salt: string) {
  // Need to figure out which salt. Don't have the brain power for encryption today.
  const subjectIdentifierDerivedKey = myScryptService.createSubjectIdentifierDerivedKey(subjectIdentifier, salt);

  if (subjectIdentifierDerivedKey === undefined) {
    console.log("SOMETHING WENT WRONG SAVING USER ID DERIVED KEY");
    return undefined;
  }
  const newEncryptedDataKey = dataEncryptionService.encrypt(subjectIdentifierDerivedKey, plainTextDataKey);

  // optionService.setOption('subjectIdentifierEncryptedDataKey', newEncryptedDataKey);
  return newEncryptedDataKey;
}

function getDataKey(subjectIdentifier: string) {
  const subjectIdentifierDerivedKey = myScryptService.getSubjectIdentifierDerivedKey(subjectIdentifier);

  const encryptedDataKey = optionService.getOption("subjectIdentifierEncryptedDataKey");

  if (subjectIdentifierDerivedKey === undefined) {
    console.log("SOMETHING WENT WRONG SAVING USER ID DERIVED KEY");
    return undefined;
  }
  const decryptedDataKey = dataEncryptionService.decrypt(subjectIdentifierDerivedKey, encryptedDataKey);

  return decryptedDataKey;
}

export = {
  verifyOpenIDSubjectIdentifier,
  getDataKey,
  setDataKey,
  saveSubjectIdentifier,
  isSubjectIdentifierSaved,
};
