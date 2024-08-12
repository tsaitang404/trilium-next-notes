"use strict";

import log from "./log.js";
import sql from "./sql.js";
import protectedSessionService from "./protected_session.js";
import dateUtils from "./date_utils.js";
import BNote from "../becca/entities/bnote.js";

function protectRevisions(note: BNote) {
    if (!protectedSessionService.isProtectedSessionAvailable()) {
        throw new Error(`Cannot (un)protect revisions of note '${note.noteId}' without active protected session`);
    }

    for (const revision of note.getRevisions()) {
        if (note.isProtected !== revision.isProtected) {
            try {
                const content = revision.getContent();

                revision.isProtected = !!note.isProtected;

                // this will force de/encryption
                revision.setContent(content, {forceSave: true});
            } catch (e) {
                log.error(`Could not un/protect note revision '${revision.revisionId}'`);

                throw e;
            }
        }

        for (const attachment of revision.getAttachments()) {
            if (note.isProtected !== attachment.isProtected) {
                try {
                    const content = attachment.getContent();

                    attachment.isProtected = note.isProtected;
                    attachment.setContent(content, {forceSave: true});
                } catch (e) {
                    log.error(`Could not un/protect attachment '${attachment.attachmentId}'`);

                    throw e;
                }
            }
        }
    }
}

export default {
    protectRevisions
};
