"use strict";

import protectedSessionService from "../../services/protected_session.js";
import utils from "../../services/utils.js";
import log from "../../services/log.js";
import noteService from "../../services/notes.js";
import tmp from "tmp";
import fs from "fs";
import { Readable } from 'stream';
import chokidar from "chokidar";
import ws from "../../services/ws.js";
import becca from "../../becca/becca.js";
import ValidationError from "../../errors/validation_error.js";
import { Request, Response } from 'express';
import BNote from "../../becca/entities/bnote.js";
import BAttachment from "../../becca/entities/battachment.js";
import { AppRequest } from '../route-interface.js';

function updateFile(req: AppRequest) {
    const note = becca.getNoteOrThrow(req.params.noteId);

    const file = req.file;
    if (!file) {
        return {
            uploaded: false,
            message: `Missing file.`
        };
    }

    note.saveRevision();

    note.mime = file.mimetype.toLowerCase();
    note.save();

    note.setContent(file.buffer);

    note.setLabel('originalFileName', file.originalname);

    noteService.asyncPostProcessContent(note, file.buffer);

    return {
        uploaded: true
    };
}

function updateAttachment(req: AppRequest) {
    const attachment = becca.getAttachmentOrThrow(req.params.attachmentId);
    const file = req.file;
    if (!file) {
        return {
            uploaded: false,
            message: `Missing file.`
        };
    }

    attachment.getNote().saveRevision();

    attachment.mime = file.mimetype.toLowerCase();
    attachment.setContent(file.buffer, {forceSave: true});

    return {
        uploaded: true
    };
}

function downloadData(noteOrAttachment: BNote | BAttachment, res: Response, contentDisposition: boolean) {
    if (noteOrAttachment.isProtected && !protectedSessionService.isProtectedSessionAvailable()) {
        return res.status(401).send("Protected session not available");
    }

    if (contentDisposition) {
        const fileName = noteOrAttachment.getFileName();

        res.setHeader('Content-Disposition', utils.getContentDisposition(fileName));
    }

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader('Content-Type', noteOrAttachment.mime);

    res.send(noteOrAttachment.getContent());
}

function downloadNoteInt(noteId: string, res: Response, contentDisposition = true) {
    const note = becca.getNote(noteId);

    if (!note) {
        return res.setHeader("Content-Type", "text/plain")
            .status(404)
            .send(`Note '${noteId}' doesn't exist.`);
    }

    return downloadData(note, res, contentDisposition);
}

function downloadAttachmentInt(attachmentId: string, res: Response, contentDisposition = true) {
    const attachment = becca.getAttachment(attachmentId);

    if (!attachment) {
        return res.setHeader("Content-Type", "text/plain")
            .status(404)
            .send(`Attachment '${attachmentId}' doesn't exist.`);
    }

    return downloadData(attachment, res, contentDisposition);
}

const downloadFile = (req: Request, res: Response) => downloadNoteInt(req.params.noteId, res, true);
const openFile = (req: Request, res: Response) => downloadNoteInt(req.params.noteId, res, false);

const downloadAttachment = (req: Request, res: Response) => downloadAttachmentInt(req.params.attachmentId, res, true);
const openAttachment = (req: Request, res: Response) => downloadAttachmentInt(req.params.attachmentId, res, false);

function fileContentProvider(req: Request) {
    // Read the file name from route params.
    const note = becca.getNoteOrThrow(req.params.noteId);

    return streamContent(note.getContent(), note.getFileName(), note.mime);
}

function attachmentContentProvider(req: Request) {
    // Read the file name from route params.
    const attachment = becca.getAttachmentOrThrow(req.params.attachmentId);

    return streamContent(attachment.getContent(), attachment.getFileName(), attachment.mime);
}

async function streamContent(content: string | Buffer, fileName: string, mimeType: string) {
    if (typeof content === "string") {
        content = Buffer.from(content, 'utf8');
    }

    const totalSize = content.byteLength;

    const getStream = (range: { start: number, end: number }) => {
        if (!range) {
            // Request if for complete content.
            return Readable.from(content);
        }
        // Partial content request.
        const {start, end} = range;

        return Readable.from(content.slice(start, end + 1));
    }

    return {
        fileName,
        totalSize,
        mimeType,
        getStream
    };
}

function saveNoteToTmpDir(req: Request) {
    const note = becca.getNoteOrThrow(req.params.noteId);
    const fileName = note.getFileName();
    const content = note.getContent();

    return saveToTmpDir(fileName, content, 'notes', note.noteId);
}

function saveAttachmentToTmpDir(req: Request) {
    const attachment = becca.getAttachmentOrThrow(req.params.attachmentId);
    const fileName = attachment.getFileName();
    const content = attachment.getContent();

    if (!attachment.attachmentId) {
        throw new ValidationError("Missing attachment ID.");
    }
    return saveToTmpDir(fileName, content, 'attachments', attachment.attachmentId);
}

const createdTemporaryFiles = new Set<string>();

function saveToTmpDir(fileName: string, content: string | Buffer, entityType: string, entityId: string) {
    const tmpObj = tmp.fileSync({ postfix: fileName });

    if (typeof content === "string") {
        fs.writeSync(tmpObj.fd, content);
    } else {
        fs.writeSync(tmpObj.fd, content);   
    }

    fs.closeSync(tmpObj.fd);

    createdTemporaryFiles.add(tmpObj.name);

    log.info(`Saved temporary file ${tmpObj.name}`);

    if (utils.isElectron()) {
        chokidar.watch(tmpObj.name).on('change', (path, stats) => {
            ws.sendMessageToAllClients({
                type: 'openedFileUpdated',
                entityType: entityType,
                entityId: entityId,
                lastModifiedMs: stats?.atimeMs,
                filePath: tmpObj.name
            });
        });
    }

    return {
        tmpFilePath: tmpObj.name
    };
}

function uploadModifiedFileToNote(req: Request) {
    const noteId = req.params.noteId;
    const {filePath} = req.body;

    if (!createdTemporaryFiles.has(filePath)) {
        throw new ValidationError(`File '${filePath}' is not a temporary file.`);
    }

    const note = becca.getNoteOrThrow(noteId);

    log.info(`Updating note '${noteId}' with content from '${filePath}'`);

    note.saveRevision();

    const fileContent = fs.readFileSync(filePath);

    if (!fileContent) {
        throw new ValidationError(`File '${fileContent}' is empty`);
    }

    note.setContent(fileContent);
}

function uploadModifiedFileToAttachment(req: Request) {
    const {attachmentId} = req.params;
    const {filePath} = req.body;

    const attachment = becca.getAttachmentOrThrow(attachmentId);

    log.info(`Updating attachment '${attachmentId}' with content from '${filePath}'`);

    attachment.getNote().saveRevision();

    const fileContent = fs.readFileSync(filePath);

    if (!fileContent) {
        throw new ValidationError(`File '${fileContent}' is empty`);
    }

    attachment.setContent(fileContent);
}

export default {
    updateFile,
    updateAttachment,
    openFile,
    fileContentProvider,
    downloadFile,
    downloadNoteInt,
    saveNoteToTmpDir,
    openAttachment,
    downloadAttachment,
    saveAttachmentToTmpDir,
    attachmentContentProvider,
    uploadModifiedFileToNote,
    uploadModifiedFileToAttachment
};
