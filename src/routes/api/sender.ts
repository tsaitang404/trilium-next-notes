"use strict";

import imageType from "image-type";
import imageService from "../../services/image.js";
import noteService from "../../services/notes.js";
import sanitize_attribute_name from "../../services/sanitize_attribute_name.js";
import specialNotesService from "../../services/special_notes.js";
import { Request } from 'express';
import { AppRequest } from '../route-interface.js';

function uploadImage(req: AppRequest) {
    const file = req.file;

    if (!file) {
        return {
            uploaded: false,
            message: `Missing image data.`
        };
    }

    if (!["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"].includes(file.mimetype)) {
        return [400, `Unknown image type: ${file.mimetype}`];
    }
    if (typeof file.buffer === "string") {
        return [400, "Invalid image content type."];
    }

    const uploadedImageType = imageType(file.buffer);
    if (!uploadedImageType) {
        return [400, "Unable to determine image type."];
    }
    const originalName = `Sender image.${uploadedImageType.ext}`;

    if (!req.headers["x-local-date"]) {
        return [400, "Invalid local date"];
    }

    const parentNote = specialNotesService.getInboxNote(req.headers['x-local-date']);

    const { note, noteId } = imageService.saveImage(parentNote.noteId, file.buffer, originalName, true);

    const labelsStr = req.headers['x-labels'];

    if (labelsStr?.trim()) {
        const labels = JSON.parse(labelsStr);

        for (const { name, value } of labels) {
            note.setLabel(sanitize_attribute_name.sanitizeAttributeName(name), value);
        }
    }

    note.setLabel("sentFromSender");

    return {
        noteId: noteId
    };
}

function saveNote(req: Request) {
    if (!req.headers["x-local-date"] || Array.isArray(req.headers["x-local-date"])) {
        return [400, "Invalid local date"];
    }

    const parentNote = specialNotesService.getInboxNote(req.headers['x-local-date']);

    const { note, branch } = noteService.createNewNote({
        parentNoteId: parentNote.noteId,
        title: req.body.title,
        content: req.body.content,
        isProtected: false,
        type: 'text',
        mime: 'text/html'
    });

    if (req.body.labels) {
        for (const { name, value } of req.body.labels) {
            note.setLabel(sanitize_attribute_name.sanitizeAttributeName(name), value);
        }
    }

    return {
        noteId: note.noteId,
        branchId: branch.branchId
    };
}

export default {
    uploadImage,
    saveNote
};
