"use strict";

import build from "./build.js";
import packageJson from "../../package.json" with { type: "json" };
import dataDir from "./data_dir.js";

const APP_DB_VERSION = 228;
const SYNC_VERSION = 32;
const CLIPPER_PROTOCOL_VERSION = "1.0";

export default {
    appVersion: packageJson.version,
    dbVersion: APP_DB_VERSION,
    nodeVersion: process.version,
    syncVersion: SYNC_VERSION,
    buildDate: build.buildDate,
    buildRevision: build.buildRevision,
    dataDirectory: dataDir.TRILIUM_DATA_DIR,
    clipperProtocolVersion: CLIPPER_PROTOCOL_VERSION,
    utcDateTime: new Date().toISOString() // for timezone inference
};
