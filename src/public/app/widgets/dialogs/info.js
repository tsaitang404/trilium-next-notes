import { t } from "../../services/i18n.js";
import utils from "../../services/utils.js";
import BasicWidget from "../basic_widget.js";

const TPL = `
<div class="info-dialog modal mx-auto" tabindex="-1" role="dialog" style="z-index: 2000;">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title mr-auto">${t("info.modalTitle")}</h5>

                <button type="button" class="close" data-dismiss="modal" aria-label="${t("info.closeButton")}">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="info-dialog-content"></div>
            </div>
            <div class="modal-footer">
                <button class="info-dialog-ok-button btn btn-primary btn-sm">${t("info.okButton")}</button>
            </div>
        </div>
    </div>
</div>`;

export default class InfoDialog extends BasicWidget {
    constructor() {
        super();

        this.resolve = null;
        this.$originallyFocused = null; // element focused before the dialog was opened, so we can return to it afterward
    }

    doRender() {
        this.$widget = $(TPL);
        this.$infoContent = this.$widget.find(".info-dialog-content");
        this.$okButton = this.$widget.find(".info-dialog-ok-button");

        this.$widget.on('shown.bs.modal', () => this.$okButton.trigger("focus"));

        this.$widget.on("hidden.bs.modal", () => {
            if (this.resolve) {
                this.resolve();
            }

            if (this.$originallyFocused) {
                this.$originallyFocused.trigger('focus');
                this.$originallyFocused = null;
            }
        });

        this.$okButton.on('click', () => this.$widget.modal("hide"));
    }

    showInfoDialogEvent({message, callback}) {
        this.$originallyFocused = $(':focus');

        this.$infoContent.text(message);

        utils.openDialog(this.$widget);

        this.resolve = callback;
    }
}
