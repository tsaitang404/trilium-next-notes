import { t } from "../../services/i18n.js";
import OnClickButtonWidget from "./onclick_button.js";

export default class ClosePaneButton extends OnClickButtonWidget {
    isEnabled() {
        return super.isEnabled()
            // main note context should not be closeable
            && this.noteContext && !!this.noteContext.mainNtxId;
    }

    async noteContextReorderEvent({ntxIdsInOrder}) {
        this.refresh();
    }

    constructor() {
        super();

        this.icon("bx-x")
            .title(t("close_pane_button.close_this_pane"))
            .titlePlacement("bottom")
            .onClick((widget, e) => {
                // to avoid split pane container detecting click within the pane which would try to activate this
                // pane (which is being removed)
                e.stopPropagation();

                widget.triggerCommand("closeThisNoteSplit", { ntxId: widget.getClosestNtxId() });
            })
            .class("icon-action");
    }
}
