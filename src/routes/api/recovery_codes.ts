import recovery_codes = require("../../services/encryption/recovery_codes");
import { Request } from "express";
import { randomBytes } from "crypto";

// Functionality moved straight to the generateRecoveryCodes function to save API calls
function setRecoveryCodes(req: Request) {
  const success = recovery_codes.setRecoveryCodes(req.body.recoveryCodes);
  return { success: success, message: "Recovery codes set!" };
}

function veryifyRecoveryCode(req: Request) {
  const success = recovery_codes.verifyRecoveryCode(
    req.body.recovery_code_guess
  );

  if (success) {
    // Reset password?
    return { success: "true" };
  }
}

function checkForRecoveryKeys() {
  return { success: true, keysExist: false };
}

function generateRecoveryCodes() {
  const recoveryCodes = {
    code0: randomBytes(16).toString("base64"),
    code1: randomBytes(16).toString("base64"),
    code2: randomBytes(16).toString("base64"),
    code3: randomBytes(16).toString("base64"),
    code4: randomBytes(16).toString("base64"),
    code5: randomBytes(16).toString("base64"),
    code6: randomBytes(16).toString("base64"),
    code7: randomBytes(16).toString("base64"),
  };

  recovery_codes.setRecoveryCodes(JSON.stringify(recoveryCodes));

  return { success: true, recoveryCodes: JSON.stringify(recoveryCodes) };
}

export = {
  setRecoveryCodes,
  generateRecoveryCodes,
  veryifyRecoveryCode,
  checkForRecoveryKeys,
};
