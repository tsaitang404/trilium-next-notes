import utils from "../../services/utils.js";
import BasicWidget from "../basic_widget.js";
import { t } from "../../services/i18n.js";

const TPL = `
<div class="help-dialog modal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document" style="min-width: 100%; height: 100%; margin: 0;">
        <div class="modal-content" style="height: auto;">
            <div class="modal-header">
                <h5 class="modal-title mr-auto">${t('help.fullDocumentation')}</h5>

                <button type="button" class="close" data-dismiss="modal" aria-label="${t('help.close')}">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body" style="overflow: auto; height: calc(100vh - 70px);">
                <div class="card-columns help-cards">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${t('help.noteNavigation')}</h5>

                            <p class="card-text">
                                <ul>
                                    <li><kbd>UP</kbd>, <kbd>DOWN</kbd> - ${t('help.goUpDown')}</li>
                                    <li><kbd>LEFT</kbd>, <kbd>RIGHT</kbd> - ${t('help.collapseExpand')}</li>
                                    <li><kbd data-command="backInNoteHistory">${t('help.notSet')}</kbd>, <kbd data-command="forwardInNoteHistory">${t('help.notSet')}</kbd> - ${t('help.goBackForwards')}</li>
                                    <li><kbd data-command="jumpToNote">${t('help.notSet')}</kbd> - ${t('help.showJumpToNoteDialog')}</li>
                                    <li><kbd data-command="scrollToActiveNote">${t('help.notSet')}</kbd> - ${t('help.scrollToActiveNote')}</li>
                                    <li><kbd>Backspace</kbd> - ${t('help.jumpToParentNote')}</li>
                                    <li><kbd data-command="collapseTree">${t('help.notSet')}</kbd> - ${t('help.collapseWholeTree')}</li>
                                    <li><kbd data-command="collapseSubtree">${t('help.notSet')}</kbd> - ${t('help.collapseSubTree')}</li>
                                </ul>
                            </p>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${t('help.tabShortcuts')}</h5>

                            <p class="card-text">
                            <ul>
                                <li><kbd>CTRL+click</kbd> ${t('help.newTabNoteLink')}</li>
                            </ul>

                            ${t('help.onlyInDesktop')}:
                            <ul>
                                <li><kbd data-command="openNewTab">${t('help.notSet')}</kbd> ${t('help.openEmptyTab')}</li>
                                <li><kbd data-command="closeActiveTab">${t('help.notSet')}</kbd> ${t('help.closeActiveTab')}</li>
                                <li><kbd data-command="activateNextTab">${t('help.notSet')}</kbd> ${t('help.activateNextTab')}</li>
                                <li><kbd data-command="activatePreviousTab">${t('help.notSet')}</kbd> ${t('help.activatePreviousTab')}</li>
                            </ul>
                            </p>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${t('help.creatingNotes')}</h5>

                            <p class="card-text">
                                <ul>
                                    <li><kbd data-command="createNoteAfter">${t('help.notSet')}</kbd> - ${t('help.createNoteAfter')}</li>
                                    <li><kbd data-command="createNoteInto">${t('help.notSet')}</kbd> - ${t('help.createNoteInto')}</li>
                                    <li><kbd data-command="editBranchPrefix">${t('help.notSet')}</kbd> - ${t('help.editBranchPrefix')}</li>
                                </ul>
                            </p>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${t('help.movingCloningNotes')}</h5>

                            <p class="card-text">
                                <ul>
                                    <li><kbd data-command="moveNoteUp">${t('help.notSet')}</kbd>, <kbd data-command="moveNoteDown">${t('help.notSet')}</kbd> - ${t('help.moveNoteUpDown')}</li>
                                    <li><kbd data-command="moveNoteUpInHierarchy">${t('help.notSet')}</kbd>, <kbd data-command="moveNoteDownInHierarchy">${t('help.notSet')}</kbd> - ${t('help.moveNoteUpHierarchy')}</li>
                                    <li><kbd data-command="addNoteAboveToSelection">${t('help.notSet')}</kbd>, <kbd data-command="addNoteBelowToSelection">${t('help.notSet')}</kbd> - ${t('help.multiSelectNote')}</li>
                                    <li><kbd data-command="selectAllNotesInParent">${t('help.notSet')}</kbd> - ${t('help.selectAllNotes')}</li>
                                    <li><kbd>Shift+click</kbd> - ${t('help.selectNote')}</li>
                                    <li><kbd data-command="copyNotesToClipboard">${t('help.notSet')}</kbd> - ${t('help.copyNotes')}</li>
                                    <li><kbd data-command="cutNotesToClipboard">${t('help.notSet')}</kbd> - ${t('help.cutNotes')}</li>
                                    <li><kbd data-command="pasteNotesFromClipboard">${t('help.notSet')}</kbd> - ${t('help.pasteNotes')}</li>
                                    <li><kbd data-command="deleteNotes">${t('help.notSet')}</kbd> - ${t('help.deleteNotes')}</li>
                                </ul>
                            </p>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${t('help.editingNotes')}</h5>

                            <p class="card-text">
                                <ul>
                                    <li><kbd data-command="editNoteTitle">${t('help.notSet')}</kbd> ${t('help.editNoteTitle')}</li>
                                    <li><kbd>Ctrl+K</kbd> - ${t('help.createEditLink')}</li>
                                    <li><kbd data-command="addLinkToText">${t('help.notSet')}</kbd> - ${t('help.createInternalLink')}</li>
                                    <li><kbd data-command="followLinkUnderCursor">${t('help.notSet')}</kbd> - ${t('help.followLink')}</li>
                                    <li><kbd data-command="insertDateTimeToText">${t('help.notSet')}</kbd> - ${t('help.insertDateTime')}</li>
                                    <li><kbd data-command="scrollToActiveNote">${t('help.notSet')}</kbd> - ${t('help.jumpToTreePane')}</li>
                                </ul>
                            </p>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title"><a class="external" href="https://triliumnext.github.io/Docs/Wiki/text-notes.html#markdown--autoformat">${t('help.markdownAutoformat')}</a></h5>

                            <p class="card-text">
                                <ul>
                                    <li><kbd>##</kbd>, <kbd>###</kbd>, <kbd>####</kbd> ${t('help.headings')}</li>
                                    <li>${t('help.bulletList')}</li>
                                    <li>${t('help.numberedList')}</li>
                                    <li>${t('help.blockQuote')}</li>
                                </ul>
                            </p>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${t('help.troubleshooting')}</h5>

                            <p class="card-text">
                                <ul>
                                    <li><kbd data-command="reloadFrontendApp">${t('help.notSet')}</kbd> - ${t('help.reloadFrontend')}</li>
                                    <li><kbd data-command="openDevTools">${t('help.notSet')}</kbd> - ${t('help.showDevTools')}</li>
                                    <li><kbd data-command="showSQLConsole">${t('help.notSet')}</kbd> - ${t('help.showSQLConsole')}</li>
                                </ul>
                            </p>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${t('help.other')}</h5>

                            <p class="card-text">
                                <ul>
                                    <li><kbd data-command="quickSearch">${t('help.notSet')}</kbd> - ${t('help.quickSearch')}</li>
                                    <li><kbd data-command="findInText">${t('help.notSet')}</kbd> - ${t('help.inPageSearch')}</li>
                                </ul>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`;

export default class HelpDialog extends BasicWidget {
    doRender() {
        this.$widget = $(TPL);
    }

    showHelpEvent() {
        utils.openDialog(this.$widget);
    }
}
