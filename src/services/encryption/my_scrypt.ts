"use strict";

import optionService = require("../options");
import crypto = require("crypto");
import utils = require("../utils");
import sql = require("../sql");

function getVerificationHash(password: crypto.BinaryLike) {
  const salt = optionService.getOption("passwordVerificationSalt");

  return getScryptHash(password, salt);
}

function getPasswordDerivedKey(password: crypto.BinaryLike) {
  const salt = optionService.getOption("passwordDerivedKeySalt");

  return getScryptHash(password, salt);
}

function getScryptHash(password: crypto.BinaryLike, salt: string | crypto.BinaryLike) {
  const hashed = crypto.scryptSync(password, salt instanceof String ? utils.toBase64(salt.toString()) : salt, 32, {
    N: 16384,
    r: 8,
    p: 1,
  });

  return hashed;
}

function getSubjectIdentifierVerificationHash(password: crypto.BinaryLike, salt: crypto.BinaryLike) {
  // const salt = optionService.getOption('subjectIdentifierVerificationSalt');

  return getScryptHash(password, salt);
}

function getSubjectIdentifierDerivedKey(subjectIdentifer: crypto.BinaryLike) {
  // const salt = optionService.getOption("subjectIdentifierDerivedKeySalt");

  const salt = sql.getValue("SELECT userIDVerificationSalt FROM user_data");
  if (salt === undefined || salt === null) return undefined;

  return getScryptHash(subjectIdentifer, utils.toBase64(salt.toString()));
}

function createSubjectIdentifierDerivedKey(subjectIdentifer: string | crypto.BinaryLike, verificationSalt: string | crypto.BinaryLike) {
  // const salt = optionService.getOption("subjectIdentifierDerivedKeySalt");

  //   const salt = sql.getValue("SELECT userIDVerificationSalt FROM user_data");
  //   if (salt === undefined || salt === null) return undefined;

  return getScryptHash(subjectIdentifer, verificationSalt);
}

export = {
  getVerificationHash,
  getPasswordDerivedKey,
  getSubjectIdentifierVerificationHash,
  getSubjectIdentifierDerivedKey,
  createSubjectIdentifierDerivedKey,
};
