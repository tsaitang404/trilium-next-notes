import BasicWidget from "../basic_widget.js";
import appContext from "../../components/app_context.js";
import contextMenu from "../../menus/context_menu.js";
import noteCreateService from "../../services/note_create.js";
import branchService from "../../services/branches.js";
import treeService from "../../services/tree.js";
import { t } from "../../services/i18n.js";

const TPL = `<button type="button" class="action-button bx bx-menu" style="padding-top: 10px;"></button>`;

class MobileDetailMenuWidget extends BasicWidget {
    doRender() {
        this.$widget = $(TPL);

        this.$widget.on("click", async e => {
            const note = appContext.tabManager.getActiveContextNote();

            contextMenu.show({
                x: e.pageX,
                y: e.pageY,
                items: [
                    { title: t("mobile_detail_menu.insert_child_note"), command: "insertChildNote", uiIcon: "bx bx-plus",
                        enabled: note.type !== 'search' },
                    { title: t("mobile_detail_menu.delete_this_note"), command: "delete", uiIcon: "bx bx-trash",
                        enabled: note.noteId !== 'root' }
                ],
                selectMenuItemHandler: async ({command}) => {
                    if (command === "insertChildNote") {
                        noteCreateService.createNote(appContext.tabManager.getActiveContextNotePath());
                    }
                    else if (command === "delete") {
                        const notePath = appContext.tabManager.getActiveContextNotePath();
                        const branchId = await treeService.getBranchIdFromUrl(notePath);

                        if (!branchId) {
                            throw new Error(t("mobile_detail_menu.error_cannot_get_branch_id", { notePath }));
                        }

                        if (await branchService.deleteNotes([branchId])) {
                            this.triggerCommand('setActiveScreen', {screen:'tree'})
                        }
                    }
                    else {
                        throw new Error(t("mobile_detail_menu.error_unrecognized_command", { command }));
                    }
                }
            });
        });
    }
}

export default MobileDetailMenuWidget;
