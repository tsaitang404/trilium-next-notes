import { t } from "../../../../services/i18n.js";
import OptionsWidget from "../options_widget.js";

const TPL = `
<div class="options-section">
    <h4>${t('ribbon.widgets')}</h4>
    <label>
        <input type="checkbox" class="promoted-attributes-open-in-ribbon">
        ${t('ribbon.promoted_attributes_message')}
    </label>
    
    <label>
        <input type="checkbox" class="edited-notes-open-in-ribbon">
        ${t('ribbon.edited_notes_message')}
    </label>
</div>`;

export default class RibbonOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);

        this.$promotedAttributesOpenInRibbon = this.$widget.find(".promoted-attributes-open-in-ribbon");
        this.$promotedAttributesOpenInRibbon.on('change', () =>
            this.updateCheckboxOption('promotedAttributesOpenInRibbon', this.$promotedAttributesOpenInRibbon));

        this.$editedNotesOpenInRibbon = this.$widget.find(".edited-notes-open-in-ribbon");
        this.$editedNotesOpenInRibbon.on('change', () =>
            this.updateCheckboxOption('editedNotesOpenInRibbon', this.$editedNotesOpenInRibbon));
    }

    async optionsLoaded(options) {
        this.setCheckboxState(this.$promotedAttributesOpenInRibbon, options.promotedAttributesOpenInRibbon);
        this.setCheckboxState(this.$editedNotesOpenInRibbon, options.editedNotesOpenInRibbon);
    }
}
