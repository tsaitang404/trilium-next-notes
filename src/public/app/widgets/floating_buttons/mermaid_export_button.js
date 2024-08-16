import { t } from "../../services/i18n.js";
import NoteContextAwareWidget from "../note_context_aware_widget.js";

const TPL = `
<button type="button"
        class="export-mermaid-button"
        title="${t('mermaid_export_button.button_title')}">
        <span class="bx bx-export"></span>
</button>
`;

export default class MermaidExportButton extends NoteContextAwareWidget {
    isEnabled() {
        return super.isEnabled()
            && this.note?.type === 'mermaid'
            && this.note.isContentAvailable()
            && this.noteContext?.viewScope.viewMode === 'default';
    }

    doRender() {
        super.doRender();

        this.$widget = $(TPL);
        this.$widget.on('click', () => this.triggerEvent('exportMermaid', {ntxId: this.ntxId}));
        this.contentSized();
    }
}
