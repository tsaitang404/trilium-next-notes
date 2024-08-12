import scriptService from "./script.js";
import cls from "./cls.js";
import sqlInit from "./sql_init.js";
import config from "./config.js";
import log from "./log.js";
import attributeService from "../services/attributes.js";
import protectedSessionService from "../services/protected_session.js";
import hiddenSubtreeService from "./hidden_subtree.js";
import BNote from "../becca/entities/bnote.js";

function getRunAtHours(note: BNote): number[] {
    try {
        return note.getLabelValues('runAtHour').map(hour => parseInt(hour));
    } catch (e: any) {
        log.error(`Could not parse runAtHour for note ${note.noteId}: ${e.message}`);

        return [];
    }
}

function runNotesWithLabel(runAttrValue: string) {
    const instanceName = config.General ? config.General.instanceName : null;
    const currentHours = new Date().getHours();
    const notes = attributeService.getNotesWithLabel('run', runAttrValue);

    for (const note of notes) {
        const runOnInstances = note.getLabelValues('runOnInstance');
        const runAtHours = getRunAtHours(note);

        if ((runOnInstances.length === 0 || runOnInstances.includes(instanceName))
            && (runAtHours.length === 0 || runAtHours.includes(currentHours))
        ) {
            scriptService.executeNoteNoException(note, { originEntity: note });
        }
    }
}

sqlInit.dbReady.then(() => {
    cls.init(() => {
        hiddenSubtreeService.checkHiddenSubtree();
    });

    if (!process.env.TRILIUM_SAFE_MODE) {
        setTimeout(cls.wrap(() => runNotesWithLabel('backendStartup')), 10 * 1000);

        setInterval(cls.wrap(() => runNotesWithLabel('hourly')), 3600 * 1000);

        setInterval(cls.wrap(() => runNotesWithLabel('daily')), 24 * 3600 * 1000);

        setInterval(cls.wrap(() => hiddenSubtreeService.checkHiddenSubtree()), 7 * 3600 * 1000);
    }

    setInterval(() => protectedSessionService.checkProtectedSessionExpiration(), 30000);
});
