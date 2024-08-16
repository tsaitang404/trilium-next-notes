import OptionsWidget from "../options_widget.js";
import server from "../../../../services/server.js";
import utils from "../../../../services/utils.js";
import { t } from "../../../../services/i18n.js";

const TPL = `
<div class="options-section">
    <h4>${t("i18n.title")}</h4>

    <div class="form-group row">
        <div class="col-6">
            <label>${t("i18n.language")}</label>
            <select class="locale-select form-control"></select>
        </div>
    </div>
</div>
`;

export default class LocalizationOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.$localeSelect = this.$widget.find(".locale-select");
        this.$localeSelect.on("change", async() => {
            const newLocale = this.$localeSelect.val();
            await server.put(`options/locale/${newLocale}`);
            utils.reloadFrontendApp("locale change");
        });
    }

    async optionsLoaded(options) {
        const availableLocales = await server.get("options/locales");
        this.$localeSelect.empty();

        for (const locale of availableLocales) {
            this.$localeSelect.append($("<option>")
                .attr("value", locale.id)
                .text(locale.name));
        }

        this.$localeSelect.val(options.locale);
    }
}