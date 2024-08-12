"use strict";

import noteService from "./notes.js";
import attributeService from "./attributes.js";
import dateUtils from "./date_utils.js";
import sql from "./sql.js";
import protectedSessionService from "./protected_session.js";
import searchService from "../services/search/services/search.js";
import SearchContext from "../services/search/search_context.js";
import hoistedNoteService from "./hoisted_note.js";
import BNote from "../becca/entities/bnote.js";

const CALENDAR_ROOT_LABEL = 'calendarRoot';
const YEAR_LABEL = 'yearNote';
const MONTH_LABEL = 'monthNote';
const DATE_LABEL = 'dateNote';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type StartOfWeek = "monday" | "sunday";

function createNote(parentNote: BNote, noteTitle: string) {
    return noteService.createNewNote({
        parentNoteId: parentNote.noteId,
        title: noteTitle,
        content: '',
        isProtected: parentNote.isProtected && protectedSessionService.isProtectedSessionAvailable(),
        type: 'text'
    }).note;
}

function getRootCalendarNote(): BNote {
    let rootNote;

    const workspaceNote = hoistedNoteService.getWorkspaceNote();

    if (!workspaceNote || !workspaceNote.isRoot()) {
        rootNote = searchService.findFirstNoteWithQuery('#workspaceCalendarRoot', new SearchContext({ignoreHoistedNote: false}));
    }

    if (!rootNote) {
        rootNote = attributeService.getNoteWithLabel(CALENDAR_ROOT_LABEL);
    }

    if (!rootNote) {
        sql.transactional(() => {
            rootNote = noteService.createNewNote({
                parentNoteId: 'root',
                title: 'Calendar',
                target: 'into',
                isProtected: false,
                type: 'text',
                content: ''
            }).note;

            attributeService.createLabel(rootNote.noteId, CALENDAR_ROOT_LABEL);
            attributeService.createLabel(rootNote.noteId, 'sorted');
        });
    }

    return rootNote as BNote;
}

function getYearNote(dateStr: string, _rootNote: BNote | null = null): BNote {
    const rootNote = _rootNote || getRootCalendarNote();

    const yearStr = dateStr.trim().substr(0, 4);

    let yearNote = searchService.findFirstNoteWithQuery(`#${YEAR_LABEL}="${yearStr}"`,
            new SearchContext({ancestorNoteId: rootNote.noteId}));

    if (yearNote) {
        return yearNote;
    }

    sql.transactional(() => {
        yearNote = createNote(rootNote, yearStr);

        attributeService.createLabel(yearNote.noteId, YEAR_LABEL, yearStr);
        attributeService.createLabel(yearNote.noteId, 'sorted');

        const yearTemplateAttr = rootNote.getOwnedAttribute('relation', 'yearTemplate');

        if (yearTemplateAttr) {
            attributeService.createRelation(yearNote.noteId, 'template', yearTemplateAttr.value);
        }
    });

    return yearNote as unknown as BNote;
}

function getMonthNoteTitle(rootNote: BNote, monthNumber: string, dateObj: Date) {
    const pattern = rootNote.getOwnedLabelValue("monthPattern") || "{monthNumberPadded} - {month}";
    const monthName = MONTHS[dateObj.getMonth()];

    return pattern
        .replace(/{shortMonth3}/g, monthName.slice(0,3))
        .replace(/{shortMonth4}/g, monthName.slice(0,4))
        .replace(/{monthNumberPadded}/g, monthNumber)
        .replace(/{month}/g, monthName);
}

function getMonthNote(dateStr: string, _rootNote: BNote | null = null): BNote {
    const rootNote = _rootNote || getRootCalendarNote();

    const monthStr = dateStr.substr(0, 7);
    const monthNumber = dateStr.substr(5, 2);

    let monthNote = searchService.findFirstNoteWithQuery(`#${MONTH_LABEL}="${monthStr}"`,
        new SearchContext({ancestorNoteId: rootNote.noteId}));

    if (monthNote) {
        return monthNote;
    }

    const dateObj = dateUtils.parseLocalDate(dateStr);

    const noteTitle = getMonthNoteTitle(rootNote, monthNumber, dateObj);

    const yearNote = getYearNote(dateStr, rootNote);

    sql.transactional(() => {
        monthNote = createNote(yearNote, noteTitle);

        attributeService.createLabel(monthNote.noteId, MONTH_LABEL, monthStr);
        attributeService.createLabel(monthNote.noteId, 'sorted');

        const monthTemplateAttr = rootNote.getOwnedAttribute('relation', 'monthTemplate');

        if (monthTemplateAttr) {
            attributeService.createRelation(monthNote.noteId, 'template', monthTemplateAttr.value);
        }
    });

    return monthNote as unknown as BNote;
}

function getDayNoteTitle(rootNote: BNote, dayNumber: string, dateObj: Date) {
    const pattern = rootNote.getOwnedLabelValue("datePattern") || "{dayInMonthPadded} - {weekDay}";
    const weekDay = DAYS[dateObj.getDay()];

    return pattern
        .replace(/{ordinal}/g, ordinal(parseInt(dayNumber)))
        .replace(/{dayInMonthPadded}/g, dayNumber)
        .replace(/{isoDate}/g, dateUtils.utcDateStr(dateObj))
        .replace(/{weekDay}/g, weekDay)
        .replace(/{weekDay3}/g, weekDay.substr(0, 3))
        .replace(/{weekDay2}/g, weekDay.substr(0, 2));
}

/** produces 1st, 2nd, 3rd, 4th, 21st, 31st for 1, 2, 3, 4, 21, 31 */
function ordinal(dayNumber: number) {
    const suffixes = ["th", "st", "nd", "rd"];
    const suffix = suffixes[(dayNumber - 20) % 10] || suffixes[dayNumber] || suffixes[0];

    return `${dayNumber}${suffix}`;
}

function getDayNote(dateStr: string, _rootNote: BNote | null = null): BNote {
    const rootNote = _rootNote || getRootCalendarNote();

    dateStr = dateStr.trim().substr(0, 10);

    let dateNote = searchService.findFirstNoteWithQuery(`#${DATE_LABEL}="${dateStr}"`,
        new SearchContext({ancestorNoteId: rootNote.noteId}));

    if (dateNote) {
        return dateNote;
    }

    const monthNote = getMonthNote(dateStr, rootNote);
    const dayNumber = dateStr.substr(8, 2);

    const dateObj = dateUtils.parseLocalDate(dateStr);

    const noteTitle = getDayNoteTitle(rootNote, dayNumber, dateObj);

    sql.transactional(() => {
        dateNote = createNote(monthNote, noteTitle);

        attributeService.createLabel(dateNote.noteId, DATE_LABEL, dateStr.substr(0, 10));

        const dateTemplateAttr = rootNote.getOwnedAttribute('relation', 'dateTemplate');

        if (dateTemplateAttr) {
            attributeService.createRelation(dateNote.noteId, 'template', dateTemplateAttr.value);
        }
    });

    return dateNote as unknown as BNote;
}

function getTodayNote(rootNote: BNote | null = null) {
    return getDayNote(dateUtils.localNowDate(), rootNote);
}

function getStartOfTheWeek(date: Date, startOfTheWeek: StartOfWeek) {
    const day = date.getDay();
    let diff;

    if (startOfTheWeek === 'monday') {
        diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    }
    else if (startOfTheWeek === 'sunday') {
        diff = date.getDate() - day;
    }
    else {
        throw new Error(`Unrecognized start of the week ${startOfTheWeek}`);
    }

    return new Date(date.setDate(diff));
}

interface WeekNoteOpts {
    startOfTheWeek?: StartOfWeek
}

function getWeekNote(dateStr: string, options: WeekNoteOpts = {}, rootNote: BNote | null = null) {
    const startOfTheWeek = options.startOfTheWeek || "monday";

    const dateObj = getStartOfTheWeek(dateUtils.parseLocalDate(dateStr), startOfTheWeek);

    dateStr = dateUtils.utcDateTimeStr(dateObj);

    return getDayNote(dateStr, rootNote);
}

export default {
    getRootCalendarNote,
    getYearNote,
    getMonthNote,
    getWeekNote,
    getDayNote,
    getTodayNote
};
