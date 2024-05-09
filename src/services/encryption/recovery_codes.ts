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

  sql.transactional(() => {
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
    const finalOutput = JSON.parse(decryptedData + decipher.final("utf-8"));

    console.log(
      "Verifying [" + recoveryCodeGuess + "] {" + typeof recoveryCodeGuess + "}"
    );
    console.log("against " + JSON.stringify(finalOutput));

    for (var a in finalOutput) {
      console.log(finalOutput[a] + ": " + typeof finalOutput[a]);
      if (recoveryCodeGuess === finalOutput[a]) {
        return true;
      }
    }
  });
  return false;
}

function updateRecoveryCodes() {
  // TODO: Remove used recovery code and reset
}

export = { setRecoveryCodes, verifyRecoveryCode };
