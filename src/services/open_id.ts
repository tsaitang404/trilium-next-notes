import OpenIDError = require("../errors/open_id_error");
import { NextFunction, Request, Response } from "express";
import openIDEncryption = require("./encryption/open_id_encryption");
import sqlInit = require("./sql_init");
import options = require("./options");
import { Session, auth } from "express-openid-connect";
import sql = require("./sql");

function isOpenIDEnabled() {
  return checkOpenIDRequirements();
}

function isUserSaved() {
  const dbf = sql.getValue<string>("SELECT isSetup FROM user_data;");
  return dbf === "true" ? true : false;
}

function checkOpenIDRequirements() {
  if (process.env.OAUTH_ENABLED === undefined) return false;
  if (process.env.OAUTH_ENABLED.toLocaleLowerCase() !== "true") return false;

  if (process.env.BASE_URL === undefined) throw new OpenIDError("BASE_URL is undefined in .env!");
  if (process.env.CLIENT_ID === undefined) throw new OpenIDError("CLIENT_ID is undefined in .env!");
  if (process.env.ISSUER_BASE_URL === undefined) throw new OpenIDError("ISSUER_BASE_URL is undefined in .env!");
  if (process.env.SECRET === undefined) throw new OpenIDError("SECRET is undefined in .env!");
  if (process.env.AUTH_0_LOGOUT === undefined) throw new OpenIDError("AUTH_0_LOGOUT is undefined in .env!");

  return true;
}

function getOAuthStatus() {
  return {
    success: true,
    message: checkOpenIDRequirements(),
  };
}

function isTokenValid(req: Request, res: Response, next: NextFunction) {
  const userStatus = openIDEncryption.isSubjectIdentifierSaved();

  if (req.oidc !== undefined) {
    const result = req.oidc
      .fetchUserInfo()
      .then((result) => {
        return {
          success: true,
          message: "Token is valid",
          user: userStatus,
        };
      })
      .catch((result) => {
        return {
          success: false,
          message: "Token is not valid",
          user: userStatus,
        };
      });
    return result;
  } else {
    return {
      success: false,
      message: "Token not set up",
      user: userStatus,
    };
  }
}

function checkAuth0Logout() {
  if (process.env.AUTH_0_LOGOUT === undefined) return false;
  if (process.env.AUTH_0_LOGOUT.toLocaleLowerCase() === "true") return true;
  return false;
}

function generateOAuthConfig() {
  const authRoutes = {
    callback: "/callback",
    login: "/authenticate",
    postLogoutRedirect: "/login",
    logout: "/logout",
  };

  const logoutParams = {
    // end_session_endpoint: "/end-session/",
  };

  const authConfig = {
    authRequired: true,
    auth0Logout: checkAuth0Logout(),
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: process.env.ISSUER_BASE_URL,
    secret: process.env.SECRET,
    clientSecret: process.env.SECRET,
    authorizationParams: {
      response_type: "code",
      scope: "openid profile email",
    },
    routes: authRoutes,
    idpLogout: true,
    logoutParams: logoutParams,
    afterCallback: async (req: Request, res: Response, session: Session) => {
      if (!sqlInit.isDbInitialized()) return session;

      if (isUserSaved()) return session;

      if (req.oidc.user === undefined) console.log("user invalid!");
      else openIDEncryption.saveSubjectIdentifier(req.oidc.user.sub.toString());

      return session;
    },
  };
  return authConfig;
}

export = {
  generateOAuthConfig,
  getOAuthStatus,
  isOpenIDEnabled,
  checkOpenIDRequirements,
  isTokenValid,
  isUserSaved,
};
