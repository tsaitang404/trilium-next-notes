import specialNotesService from "../services/special_notes.js";
import dateNotesService from "../services/date_notes.js";
import eu from "./etapi_utils.js";
import mappers from "./mappers.js";
import { Router } from 'express';

const getDateInvalidError = (date: string) => new eu.EtapiError(400, "DATE_INVALID", `Date "${date}" is not valid.`);
const getMonthInvalidError = (month: string)=> new eu.EtapiError(400, "MONTH_INVALID", `Month "${month}" is not valid.`);
const getYearInvalidError = (year: string) => new eu.EtapiError(400, "YEAR_INVALID", `Year "${year}" is not valid.`);

function isValidDate(date: string) {
    if (!/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(date)) {
        return false;
    }

    return !!Date.parse(date);
}

function register(router: Router) {
    eu.route(router, 'get', '/etapi/inbox/:date', (req, res, next) => {
        const { date } = req.params;

        if (!isValidDate(date)) {
            throw getDateInvalidError(date);
        }

        const note = specialNotesService.getInboxNote(date);
        res.json(mappers.mapNoteToPojo(note));
    });

    eu.route(router, 'get', '/etapi/calendar/days/:date', (req, res, next) => {
        const { date } = req.params;

        if (!isValidDate(date)) {
            throw getDateInvalidError(date);
        }

        const note = dateNotesService.getDayNote(date);
        res.json(mappers.mapNoteToPojo(note));
    });

    eu.route(router, 'get', '/etapi/calendar/weeks/:date', (req, res, next) => {
        const { date } = req.params;

        if (!isValidDate(date)) {
            throw getDateInvalidError(date);
        }

        const note = dateNotesService.getWeekNote(date);
        res.json(mappers.mapNoteToPojo(note));
    });

    eu.route(router, 'get', '/etapi/calendar/months/:month', (req, res, next) => {
        const { month } = req.params;

        if (!/[0-9]{4}-[0-9]{2}/.test(month)) {
            throw getMonthInvalidError(month);
        }

        const note = dateNotesService.getMonthNote(month);
        res.json(mappers.mapNoteToPojo(note));
    });

    eu.route(router, 'get', '/etapi/calendar/years/:year', (req, res, next) => {
        const { year } = req.params;

        if (!/[0-9]{4}/.test(year)) {
            throw getYearInvalidError(year);
        }

        const note = dateNotesService.getYearNote(year);
        res.json(mappers.mapNoteToPojo(note));
    });
}

export default {
    register
};
