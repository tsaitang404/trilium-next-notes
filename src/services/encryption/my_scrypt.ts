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

function getScryptHash(
  password: crypto.BinaryLike,
  salt: string | crypto.BinaryLike
) {
  const hashed = crypto.scryptSync(
    password,
    salt instanceof String ? utils.toBase64(salt.toString()) : salt,
    32,
    {
      N: 16384,
      r: 8,
      p: 1,
    }
  );

  return hashed;
}

function getSubjectIdentifierVerificationHash(
  guessedUserId: string | crypto.BinaryLike,
  salt?: string
) {
  if (salt != null) return getScryptHash(guessedUserId, salt);

  const savedSalt = sql.getValue("SELECT salt FROM user_data;");
  if (savedSalt === undefined || savedSalt === null) {
    console.log("User salt undefined!");
    return undefined;
  }
  return getScryptHash(guessedUserId, savedSalt.toString());
}

function getSubjectIdentifierDerivedKey(
  subjectIdentifer: crypto.BinaryLike,
  givenSalt?: string
) {
  if (givenSalt !== undefined) {
    return getScryptHash(subjectIdentifer, givenSalt.toString());
  }

  const salt = sql.getValue("SELECT salt FROM user_data;");
  if (salt === undefined || salt === null) return undefined;

  return getScryptHash(subjectIdentifer, salt.toString());
}

function createSubjectIdentifierDerivedKey(
  subjectIdentifer: string | crypto.BinaryLike,
  salt: string | crypto.BinaryLike
) {
  // const salt = optionService.getOption("subjectIdentifierDerivedKeySalt");

  //   const salt = sql.getValue("SELECT salt FROM user_data");
  //   if (salt === undefined || salt === null) return undefined;

  return getScryptHash(subjectIdentifer, salt);
}

<<<<<<< HEAD
export = {
  getVerificationHash,
  getPasswordDerivedKey,
  getSubjectIdentifierVerificationHash,
  getSubjectIdentifierDerivedKey,
  createSubjectIdentifierDerivedKey,
=======
export default {
    getVerificationHash,
    getPasswordDerivedKey
>>>>>>> develop
};
