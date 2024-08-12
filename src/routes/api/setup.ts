"use strict";

import sqlInit from "../../services/sql_init.js";
import setupService from "../../services/setup.js";
import log from "../../services/log.js";
import appInfo from "../../services/app_info.js";
import { Request } from 'express';

function getStatus() {
    return {
        isInitialized: sqlInit.isDbInitialized(),
        schemaExists: sqlInit.schemaExists(),
        syncVersion: appInfo.syncVersion
    };
}

async function setupNewDocument() {
    await sqlInit.createInitialDatabase();
}

function setupSyncFromServer(req: Request) {
    const { syncServerHost, syncProxy, password } = req.body;

    return setupService.setupSyncFromSyncServer(syncServerHost, syncProxy, password);
}

function saveSyncSeed(req: Request) {
    const { options, syncVersion } = req.body;

    if (appInfo.syncVersion !== syncVersion) {
        const message = `Could not setup sync since local sync protocol version is ${appInfo.syncVersion} while remote is ${syncVersion}. To fix this issue, use same Trilium version on all instances.`;

        log.error(message);

        return [400, {
            error: message
        }]
    }

    log.info("Saved sync seed.");

    sqlInit.createDatabaseForSync(options);
}

function getSyncSeed() {
    log.info("Serving sync seed.");

    return {
        options: setupService.getSyncSeedOptions(),
        syncVersion: appInfo.syncVersion
    };
}

export default {
    getStatus,
    setupNewDocument,
    setupSyncFromServer,
    getSyncSeed,
    saveSyncSeed
};
