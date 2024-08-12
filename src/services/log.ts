"use strict";

import { Request, Response } from "express";
import fs from "fs";
import dataDir from "./data_dir.js";
import cls from "./cls.js";

if (!fs.existsSync(dataDir.LOG_DIR)) {
    fs.mkdirSync(dataDir.LOG_DIR, 0o700);
}

let logFile!: fs.WriteStream;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const NEW_LINE = process.platform === "win32" ? '\r\n' : '\n';

let todaysMidnight!: Date;

initLogFile();

function getTodaysMidnight() {
    const now = new Date();

    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function initLogFile() {
    todaysMidnight = getTodaysMidnight();

    const path = `${dataDir.LOG_DIR}/trilium-${formatDate()}.log`;

    if (logFile) {
        logFile.end();
    }

    logFile = fs.createWriteStream(path, {flags: 'a'});
}

function checkDate(millisSinceMidnight: number) {
    if (millisSinceMidnight >= DAY) {
        initLogFile();

        millisSinceMidnight -= DAY;
    }

    return millisSinceMidnight;
}

function log(str: string | Error) {
    const bundleNoteId = cls.get("bundleNoteId");

    if (bundleNoteId) {
        str = `[Script ${bundleNoteId}] ${str}`;
    }

    let millisSinceMidnight = Date.now() - todaysMidnight.getTime();

    millisSinceMidnight = checkDate(millisSinceMidnight);

    logFile.write(`${formatTime(millisSinceMidnight)} ${str}${NEW_LINE}`);

    console.log(str);
}

function info(message: string | Error) {
    log(message);
}

function error(message: string | Error) {
    log(`ERROR: ${message}`);
}

const requestBlacklist = [ "/libraries", "/app", "/images", "/stylesheets", "/api/recent-notes" ];

function request(req: Request, res: Response, timeMs: number, responseLength: number | string = "?") {
    for (const bl of requestBlacklist) {
        if (req.url.startsWith(bl)) {
            return;
        }
    }

    if (req.url.includes(".js.map") || req.url.includes(".css.map")) {
        return;
    }

    info((timeMs >= 10 ? "Slow " : "") +
        `${res.statusCode} ${req.method} ${req.url} with ${responseLength} bytes took ${timeMs}ms`);
}

function pad(num: number) {
    num = Math.floor(num);

    return num < 10 ? (`0${num}`) : num.toString();
}

function padMilli(num: number) {
    if (num < 10) {
        return `00${num}`;
    }
    else if (num < 100) {
        return `0${num}`;
    }
    else {
        return num.toString();
    }
}

function formatTime(millisSinceMidnight: number) {
    return `${pad(millisSinceMidnight / HOUR)}:${pad((millisSinceMidnight % HOUR) / MINUTE)}:${pad((millisSinceMidnight % MINUTE) / SECOND)}.${padMilli(millisSinceMidnight % SECOND)}`;
}

function formatDate() {
    return `${pad(todaysMidnight.getFullYear())}-${pad(todaysMidnight.getMonth() + 1)}-${pad(todaysMidnight.getDate())}`;
}

export default {
    info,
    error,
    request
};
