import { Request } from "express";

import becca from "../../becca/becca.js";
import markdownService from "../../services/import/markdown.js";

function getIconUsage() {
    const iconClassToCountMap: Record<string, number> = {};

    for (const {value: iconClass, noteId} of becca.findAttributes('label', 'iconClass')) {
        if (noteId.startsWith("_")) {
            continue; // ignore icons of "system" notes since they were not set by the user
        }

        if (!iconClass?.trim()) {
            continue;
        }

        for (const clazz of iconClass.trim().split(/\s+/)) {
            if (clazz === 'bx') {
                continue;
            }

            iconClassToCountMap[clazz] = (iconClassToCountMap[clazz] || 0) + 1;
        }
    }

    return { iconClassToCountMap };
}

function renderMarkdown(req: Request) {
    const { markdownContent } = req.body;

    return {
        htmlContent: markdownService.renderToHtml(markdownContent, '')
    };
}

export default {
    getIconUsage,
    renderMarkdown
};
