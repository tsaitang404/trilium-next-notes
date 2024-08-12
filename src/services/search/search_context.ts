"use strict";

import hoistedNoteService from "../hoisted_note.js";
import { SearchParams } from './services/types.js';

class SearchContext {
    
    fastSearch: boolean;
    includeArchivedNotes: boolean;
    includeHiddenNotes: boolean;
    ignoreHoistedNote: boolean;
    ancestorNoteId?: string;
    ancestorDepth?: string;
    orderBy?: string;
    orderDirection?: string;
    limit?: number | null;
    debug?: boolean;
    debugInfo: {} | null;
    fuzzyAttributeSearch: boolean;
    highlightedTokens: string[];
    originalQuery: string;
    fulltextQuery: string;
    dbLoadNeeded: boolean;
    private error: string | null;

    constructor(params: SearchParams = {}) {
        this.fastSearch = !!params.fastSearch;
        this.includeArchivedNotes = !!params.includeArchivedNotes;
        this.includeHiddenNotes = !!params.includeHiddenNotes;
        this.ignoreHoistedNote = !!params.ignoreHoistedNote;
        this.ancestorNoteId = params.ancestorNoteId;

        if (!this.ancestorNoteId && !this.ignoreHoistedNote) {
            // hoisting in hidden subtree should not limit autocomplete
            // since we want to link (create relations) to the normal non-hidden notes
            this.ancestorNoteId = hoistedNoteService.getHoistedNoteId();
        }

        this.ancestorDepth = params.ancestorDepth;
        this.orderBy = params.orderBy;
        this.orderDirection = params.orderDirection;
        this.limit = params.limit;
        this.debug = params.debug;
        this.debugInfo = null;
        this.fuzzyAttributeSearch = !!params.fuzzyAttributeSearch;
        this.highlightedTokens = [];
        this.originalQuery = "";
        this.fulltextQuery = ""; // complete fulltext part
        // if true, becca does not have (up-to-date) information needed to process the query
        // and some extra data needs to be loaded before executing
        this.dbLoadNeeded = false;
        this.error = null;
    }

    addError(error: string) {
        // we record only the first error, subsequent ones are usually a consequence of the first
        if (!this.error) {
            this.error = error;
        }
    }

    hasError() {
        return !!this.error;
    }

    getError() {
        return this.error;
    }
}

export default SearchContext;
