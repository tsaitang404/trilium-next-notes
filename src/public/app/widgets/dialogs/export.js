import treeService from "../../services/tree.js";
import utils from "../../services/utils.js";
import ws from "../../services/ws.js";
import toastService from "../../services/toast.js";
import froca from "../../services/froca.js";
import openService from "../../services/open.js";
import BasicWidget from "../basic_widget.js";
import { t } from "../../services/i18n.js";

const TPL = `
<div class="export-dialog modal fade mx-auto" tabindex="-1" role="dialog">
    <style>
    .export-dialog .export-form .form-check {
        padding-top: 10px;
        padding-bottom: 10px;
    }
    
    .export-dialog .export-form .format-choice {
        padding-left: 40px;
        display: none;
    }
    
    .export-dialog .export-form .opml-versions {
        padding-left: 60px;
        display: none;
    }
    
    .export-dialog .export-form .form-check-label {
        padding: 2px;
    }
    </style>

    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">${t('export.export_note_title')} <span class="export-note-title"></span></h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="${t('export.close')}">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <form class="export-form">
                <div class="modal-body">
                    <div class="form-check">
                        <label class="form-check-label">
                            <input class="export-type-subtree form-check-input" type="radio" name="export-type" value="subtree">
                            ${t('export.export_type_subtree')}
                        </label>
                    </div>

                    <div class="export-subtree-formats format-choice">
                        <div class="form-check">
                            <label class="form-check-label">
                                <input class="form-check-input" type="radio" name="export-subtree-format" value="html">
                                ${t('export.format_html')}
                            </label>
                        </div>

                        <div class="form-check">
                            <label class="form-check-label">
                                <input class="form-check-input" type="radio" name="export-subtree-format" value="markdown">
                                ${t('export.format_markdown')}
                            </label>
                        </div>

                        <div class="form-check">
                            <label class="form-check-label">
                                <input class="form-check-input" type="radio" name="export-subtree-format" value="opml">
                                ${t('export.format_opml')}
                            </label>
                        </div>

                        <div class="opml-versions">
                            <div class="form-check">
                                <label class="form-check-label">
                                    <input class="form-check-input" type="radio" name="opml-version" value="1.0">
                                    ${t('export.opml_version_1')}
                                </label>
                            </div>

                            <div class="form-check">
                                <label class="form-check-label">
                                    <input class="form-check-input" type="radio" name="opml-version" value="2.0">
                                    ${t('export.opml_version_2')}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="form-check">
                        <label class="form-check-label">
                            <input class="form-check-input" type="radio" name="export-type" value="single">
                            ${t('export.export_type_single')}
                        </label>
                    </div>

                    <div class="export-single-formats format-choice">
                        <div class="form-check">
                            <label class="form-check-label">
                                <input class="form-check-input" type="radio" name="export-single-format" value="html">
                                ${t('export.format_html')}
                            </label>
                        </div>

                        <div class="form-check">
                            <label class="form-check-label">
                                <input class="form-check-input" type="radio" name="export-single-format" value="markdown">
                                ${t('export.format_markdown')}
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="export-button btn btn-primary">${t('export.export')}</button>
                </div>
            </form>
        </div>
    </div>
</div>`;

export default class ExportDialog extends BasicWidget {
    constructor() {
        super();

        this.taskId = '';
        this.branchId = null;
    }

    doRender() {
        this.$widget = $(TPL);
        this.$form = this.$widget.find(".export-form");
        this.$noteTitle = this.$widget.find(".export-note-title");
        this.$subtreeFormats = this.$widget.find(".export-subtree-formats");
        this.$singleFormats = this.$widget.find(".export-single-formats");
        this.$subtreeType = this.$widget.find(".export-type-subtree");
        this.$singleType = this.$widget.find(".export-type-single");
        this.$exportButton = this.$widget.find(".export-button");
        this.$opmlVersions = this.$widget.find(".opml-versions");

        this.$form.on('submit', () => {
            this.$widget.modal('hide');

            const exportType = this.$widget.find("input[name='export-type']:checked").val();

            if (!exportType) {
                toastService.showError(t('export.choose_export_type'));
                return;
            }

            const exportFormat = exportType === 'subtree'
                ? this.$widget.find("input[name=export-subtree-format]:checked").val()
                : this.$widget.find("input[name=export-single-format]:checked").val();

            const exportVersion = exportFormat === 'opml'
                ? this.$widget.find("input[name='opml-version']:checked").val()
                : "1.0";

            this.exportBranch(this.branchId, exportType, exportFormat, exportVersion);

            return false;
        });

        this.$widget.find('input[name=export-type]').on('change', e => {
            if (e.currentTarget.value === 'subtree') {
                if (this.$widget.find("input[name=export-subtree-format]:checked").length === 0) {
                    this.$widget.find("input[name=export-subtree-format]:first").prop("checked", true);
                }

                this.$subtreeFormats.slideDown();
                this.$singleFormats.slideUp();
            }
            else {
                if (this.$widget.find("input[name=export-single-format]:checked").length === 0) {
                    this.$widget.find("input[name=export-single-format]:first").prop("checked", true);
                }

                this.$subtreeFormats.slideUp();
                this.$singleFormats.slideDown();
            }
        });

        this.$widget.find('input[name=export-subtree-format]').on('change', e => {
            if (e.currentTarget.value === 'opml') {
                this.$opmlVersions.slideDown();
            }
            else {
                this.$opmlVersions.slideUp();
            }
        });
    }

    async showExportDialogEvent({notePath, defaultType}) {
        this.taskId = '';
        this.$exportButton.removeAttr("disabled");

        if (defaultType === 'subtree') {
            this.$subtreeType.prop("checked", true).trigger('change');

            this.$widget.find("input[name=export-subtree-format]:checked").trigger('change');
        }
        else if (defaultType === 'single') {
            this.$singleType.prop("checked", true).trigger('change');
        }
        else {
            throw new Error(`Unrecognized type '${defaultType}'`);
        }

        this.$widget.find(".opml-v2").prop("checked", true); // setting default

        utils.openDialog(this.$widget);

        const {noteId, parentNoteId} = treeService.getNoteIdAndParentIdFromUrl(notePath);

        this.branchId = await froca.getBranchId(parentNoteId, noteId);
        this.$noteTitle.text(await treeService.getNoteTitle(noteId));
    }

    exportBranch(branchId, type, format, version) {
        this.taskId = utils.randomString(10);

        const url = openService.getUrlForDownload(`api/branches/${branchId}/export/${type}/${format}/${version}/${this.taskId}`);

        openService.download(url);
    }
}

ws.subscribeToMessages(async message => {
    const makeToast = (id, message) => ({
        id: id,
        title: t('export.export_status'),
        message: message,
        icon: "arrow-square-up-right"
    });

    if (message.taskType !== 'export') {
        return;
    }

    if (message.type === 'taskError') {
        toastService.closePersistent(message.taskId);
        toastService.showError(message.message);
    }
    else if (message.type === 'taskProgressCount') {
        toastService.showPersistent(makeToast(message.taskId, t('export.export_in_progress', { progressCount: message.progressCount })));
    }
    else if (message.type === 'taskSucceeded') {
        const toast = makeToast(message.taskId, t('export.export_finished_successfully'));
        toast.closeAfter = 5000;

        toastService.showPersistent(toast);
    }
});
