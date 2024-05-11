"use strict";

import sql = require("../sql");
import optionService = require("../options");
import crypto = require("crypto");

function isRecoveryCodeSet() {
  return optionService.getOptionBool("encryptedRecoveryCodes");
}

function setRecoveryCodes(recoveryCodes: string) {
  const iv = crypto.randomBytes(16);
  const securityKey = crypto.randomBytes(32);
  const cipher = crypto.createCipheriv("aes-256-cbc", securityKey, iv);
  let encryptedRecoveryCodes = cipher.update(recoveryCodes, "utf-8", "hex");

  sql.transactional(() => {
    optionService.createOption(
      "recoveryCodeInitialVector",
      iv.toString("hex"),
      true
    );
    optionService.createOption(
      "recoveryCodeSecurityKey",
      securityKey.toString("hex"),
      true
    );
    optionService.createOption(
      "recoveryCodesEncrypted",
      encryptedRecoveryCodes + cipher.final("hex"),
      true
    );
    optionService.createOption("encryptedRecoveryCodes", "true", true);
    return true;
  });
  return false;
}

function verifyRecoveryCode(recoveryCodeGuess: string) {
  if (!isRecoveryCodeSet()) {
    throw new Error(
      "Recovery codes have not been set yet, so it cannot be changed. Use 'setRecoveryCodes' instead."
    );
  }

  const recoveryCodeVerification = sql.transactional(() => {
    const iv = Buffer.from(
      optionService.getOption("recoveryCodeInitialVector"),
      "hex"
    );
    const securityKey = Buffer.from(
      optionService.getOption("recoveryCodeSecurityKey"),
      "hex"
    );
    const encryptedRecoveryCodes = optionService.getOption(
      "recoveryCodesEncrypted"
    );

    const decipher = crypto.createDecipheriv("aes-256-cbc", securityKey, iv);
    const decryptedData = decipher.update(
      encryptedRecoveryCodes,
      "hex",
      "utf-8"
    );

    const decryptedString = decryptedData + decipher.final("utf-8");
    const editedString = decryptedString.replaceAll("\\", "");
    const finalString = editedString.substring(1, editedString.length - 1);
    const finalParse = JSON.parse(finalString);

    for (const recoveryCode in finalParse) {
      if (finalParse[recoveryCode] === recoveryCodeGuess) {
        updateRecoveryCodes(finalParse[recoveryCode]);
        return true;
      }
    }

    return false;
  });

  return recoveryCodeVerification;
}

function updateRecoveryCodes(codeToRemove: string) {
  // TODO: Remove used recovery code and reset
}

export = { setRecoveryCodes, verifyRecoveryCode };
