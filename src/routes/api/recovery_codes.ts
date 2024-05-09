import recovery_codes = require("../../services/encryption/recovery_codes");
import { Request } from "express";

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
  }
}

export = {
  setRecoveryCodes,
  veryifyRecoveryCode,
};
