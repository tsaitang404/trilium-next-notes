import { t } from "../../services/i18n.js";
import NoteContextAwareWidget from "../note_context_aware_widget.js";
import noteAutocompleteService from "../../services/note_autocomplete.js";
import server from "../../services/server.js";
import contextMenuService from "../../menus/context_menu.js";
import attributeParser from "../../services/attribute_parser.js";
import libraryLoader from "../../services/library_loader.js";
import froca from "../../services/froca.js";
import attributeRenderer from "../../services/attribute_renderer.js";
import noteCreateService from "../../services/note_create.js";
import attributeService from "../../services/attributes.js";
import linkService from "../../services/link.js";

const HELP_TEXT = `
<p>${t("attribute_editor.help_text_body1")}</p>

<p>${t("attribute_editor.help_text_body2")}</p>

<p>${t("attribute_editor.help_text_body3")}</p>`;

const TPL = `
<div style="position: relative; padding-top: 10px; padding-bottom: 10px">
    <style>
    .attribute-list-editor {
        border: 0 !important;
        outline: 0 !important;
        box-shadow: none !important;
        padding: 0 0 0 5px !important;
        margin: 0 !important;
        max-height: 100px;
        overflow: auto;
        transition: opacity .1s linear;
    }
    
    .attribute-list-editor.ck-content .mention {
        color: var(--muted-text-color) !important;
        background: transparent !important;
    }
        
    .save-attributes-button {
        color: var(--muted-text-color);
        position: absolute; 
        bottom: 14px;
        right: 25px;
        cursor: pointer;
        border: 1px solid transparent;
        font-size: 130%;
    }
    
    .add-new-attribute-button {
        color: var(--muted-text-color);
        position: absolute; 
        bottom: 13px;
        right: 0; 
        cursor: pointer;
        border: 1px solid transparent;
        font-size: 130%;
    }
    
    .add-new-attribute-button:hover, .save-attributes-button:hover {
        border: 1px solid var(--button-border-color);
        border-radius: var(--button-border-radius);
        background: var(--button-background-color);
        color: var(--button-text-color);
    }
    
    .attribute-errors {
        color: red;
        padding: 5px 50px 0px 5px; /* large right padding to avoid buttons */
    }
    </style>
    
    <div class="attribute-list-editor" tabindex="200"></div>

    <div class="bx bx-save save-attributes-button" title="${t("attribute_editor.save_attributes")}"></div>
    <div class="bx bx-plus add-new-attribute-button" title="${t("attribute_editor.add_a_new_attribute")}"></div>
    
    <div class="attribute-errors" style="display: none;"></div>
</div>
`;

const mentionSetup = {
    feeds: [
        {
            marker: '@',
            feed: queryText => noteAutocompleteService.autocompleteSourceForCKEditor(queryText),
            itemRenderer: item => {
                const itemElement = document.createElement('button');

                itemElement.innerHTML = `${item.highlightedNotePathTitle} `;

                return itemElement;
            },
            minimumCharacters: 0
        },
        {
            marker: '#',
            feed: async queryText => {
                const names = await server.get(`attribute-names/?type=label&query=${encodeURIComponent(queryText)}`);

                return names.map(name => {
                    return {
                        id: `#${name}`,
                        name: name
                    }
                });
            },
            minimumCharacters: 0
        },
        {
            marker: '~',
            feed: async queryText => {
                const names = await server.get(`attribute-names/?type=relation&query=${encodeURIComponent(queryText)}`);

                return names.map(name => {
                    return {
                        id: `~${name}`,
                        name: name
                    }
                });
            },
            minimumCharacters: 0
        }
    ]
};

const editorConfig = {
    removePlugins: [
        'Heading',
        'Link',
        'Autoformat',
        'Bold',
        'Italic',
        'Underline',
        'Strikethrough',
        'Code',
        'Superscript',
        'Subscript',
        'BlockQuote',
        'Image',
        'ImageCaption',
        'ImageStyle',
        'ImageToolbar',
        'ImageUpload',
        'ImageResize',
        'List',
        'TodoList',
        'PasteFromOffice',
        'Table',
        'TableToolbar',
        'TableProperties',
        'TableCellProperties',
        'Indent',
        'IndentBlock',
        'BlockToolbar',
        'ParagraphButtonUI',
        'HeadingButtonsUI',
        'UploadimagePlugin',
        'InternalLinkPlugin',
        'MarkdownImportPlugin',
        'CuttonotePlugin',
        'TextTransformation',
        'Font',
        'FontColor',
        'FontBackgroundColor',
        'CodeBlock',
        'SelectAll',
        'IncludeNote',
        'CutToNote',
        'Mathematics',
        'AutoformatMath',
        'indentBlockShortcutPlugin',
        'removeFormatLinksPlugin'
    ],
    toolbar: {
        items: []
    },
    placeholder: "Type the labels and relations here",
    mention: mentionSetup
};

export default class AttributeEditorWidget extends NoteContextAwareWidget {
    constructor(attributeDetailWidget) {
        super();

        this.attributeDetailWidget = attributeDetailWidget;
    }

    doRender() {
        this.$widget = $(TPL);
        this.$editor = this.$widget.find('.attribute-list-editor');

        this.initialized = this.initEditor();

        this.$editor.on('keydown', async e => {
            if (e.which === 13) {
                // allow autocomplete to fill the result textarea
                setTimeout(() => this.save(), 100);
            }

            this.attributeDetailWidget.hide();
        });

        this.$editor.on('blur', () => setTimeout(() => this.save(), 100)); // Timeout to fix https://github.com/zadam/trilium/issues/4160

        this.$addNewAttributeButton = this.$widget.find('.add-new-attribute-button');
        this.$addNewAttributeButton.on('click', e => this.addNewAttribute(e));

        this.$saveAttributesButton = this.$widget.find('.save-attributes-button');
        this.$saveAttributesButton.on('click', () => this.save());

        this.$errors = this.$widget.find('.attribute-errors');
    }

    addNewAttribute(e) {
        contextMenuService.show({
            x: e.pageX,
            y: e.pageY,
            orientation: 'left',
            items: [
                { title: t("attribute_editor.add_new_label"), command: "addNewLabel", uiIcon: "bx bx-hash" },
                { title: t("attribute_editor.add_new_relation"), command: "addNewRelation", uiIcon: "bx bx-transfer" },
                { title: "----" },
                { title: t("attribute_editor.add_new_label_definition"), command: "addNewLabelDefinition", uiIcon: "bx bx-empty" },
                { title: t("attribute_editor.add_new_relation_definition"), command: "addNewRelationDefinition", uiIcon: "bx bx-empty" },
            ],
            selectMenuItemHandler: ({ command }) => this.handleAddNewAttributeCommand(command)
        });
    }

    // triggered from keyboard shortcut
    async addNewLabelEvent({ntxId}) {
        if (this.isNoteContext(ntxId)) {
            await this.refresh();

            this.handleAddNewAttributeCommand('addNewLabel');
        }
    }

    // triggered from keyboard shortcut
    async addNewRelationEvent({ntxId}) {
        if (this.isNoteContext(ntxId)) {
            await this.refresh();

            this.handleAddNewAttributeCommand('addNewRelation');
        }
    }

    async handleAddNewAttributeCommand(command) {
        const attrs = this.parseAttributes();

        if (!attrs) {
            return;
        }

        let type, name, value;

        if (command === 'addNewLabel') {
            type = 'label';
            name = 'myLabel';
            value = '';
        } else if (command === 'addNewRelation') {
            type = 'relation';
            name = 'myRelation';
            value = '';
        } else if (command === 'addNewLabelDefinition') {
            type = 'label';
            name = 'label:myLabel';
            value = 'promoted,single,text';
        } else if (command === 'addNewRelationDefinition') {
            type = 'label';
            name = 'relation:myRelation';
            value = 'promoted,single';
        } else {
            return;
        }

        attrs.push({
            type,
            name,
            value,
            isInheritable: false
        });

        await this.renderOwnedAttributes(attrs, false);

        this.$editor.scrollTop(this.$editor[0].scrollHeight);

        const rect = this.$editor[0].getBoundingClientRect();

        setTimeout(() => {
            // showing a little bit later because there's a conflict with outside click closing the attr detail
            this.attributeDetailWidget.showAttributeDetail({
                allAttributes: attrs,
                attribute: attrs[attrs.length - 1],
                isOwned: true,
                x: (rect.left + rect.right) / 2,
                y: rect.bottom,
                focus: 'name'
            });
        }, 100);
    }

    async save() {
        if (this.lastUpdatedNoteId !== this.noteId) {
            // https://github.com/zadam/trilium/issues/3090
            console.warn("Ignoring blur event because a different note is loaded.");
            return;
        }

        const attributes = this.parseAttributes();

        if (attributes) {
            await server.put(`notes/${this.noteId}/attributes`, attributes, this.componentId);

            this.$saveAttributesButton.fadeOut();

            // blink the attribute text to give a visual hint that save has been executed
            this.$editor.css('opacity', 0);

            // revert back
            setTimeout(() => this.$editor.css('opacity', 1), 100);
        }
    }

    parseAttributes() {
        try {
            return attributeParser.lexAndParse(this.getPreprocessedData());
        }
        catch (e) {
            this.$errors.text(e.message).slideDown();
        }
    }

    getPreprocessedData() {
        const str = this.textEditor.getData()
            .replace(/<a[^>]+href="(#[A-Za-z0-9_/]*)"[^>]*>[^<]*<\/a>/g, "$1")
            .replace(/&nbsp;/g, " "); // otherwise .text() below outputs non-breaking space in unicode

        return $("<div>").html(str).text();
    }

    async initEditor() {
        await libraryLoader.requireLibrary(libraryLoader.CKEDITOR);

        this.$widget.show();

        this.$editor.on("click", e => this.handleEditorClick(e));

        /** @property {BalloonEditor} */
        this.textEditor = await BalloonEditor.create(this.$editor[0], editorConfig);
        this.textEditor.model.document.on('change:data', () => this.dataChanged());
        this.textEditor.editing.view.document.on('enter', (event, data) => {
            // disable entering new line - see https://github.com/ckeditor/ckeditor5/issues/9422
            data.preventDefault();
            event.stop();
        }, {priority: 'high'});

        // disable spellcheck for attribute editor
        this.textEditor.editing.view.change(writer => writer.setAttribute('spellcheck', 'false', this.textEditor.editing.view.document.getRoot()));

        //await import(/* webpackIgnore: true */'../../libraries/ckeditor/inspector');
        //CKEditorInspector.attach(this.textEditor);
    }

    dataChanged() {
        this.lastUpdatedNoteId = this.noteId;

        if (this.lastSavedContent === this.textEditor.getData()) {
            this.$saveAttributesButton.fadeOut();
        }
        else {
            this.$saveAttributesButton.fadeIn();
        }

        if (this.$errors.is(":visible")) {
            // using .hide() instead of .slideUp() since this will also hide the error after confirming
            // mention for relation name which suits up. When using.slideUp() error will appear and the slideUp which is weird
            this.$errors.hide();
        }
    }

    async handleEditorClick(e) {
        const pos = this.textEditor.model.document.selection.getFirstPosition();

        if (pos && pos.textNode && pos.textNode.data) {
            const clickIndex = this.getClickIndex(pos);

            let parsedAttrs;

            try {
                parsedAttrs = attributeParser.lexAndParse(this.getPreprocessedData(), true);
            }
            catch (e) {
                // the input is incorrect because the user messed up with it and now needs to fix it manually
                return null;
            }

            let matchedAttr = null;

            for (const attr of parsedAttrs) {
                if (clickIndex > attr.startIndex && clickIndex <= attr.endIndex) {
                    matchedAttr = attr;
                    break;
                }
            }

            setTimeout(() => {
                if (matchedAttr) {
                    this.$editor.tooltip('hide');

                    this.attributeDetailWidget.showAttributeDetail({
                        allAttributes: parsedAttrs,
                        attribute: matchedAttr,
                        isOwned: true,
                        x: e.pageX,
                        y: e.pageY
                    });
                }
                else {
                    this.showHelpTooltip();
                }
            }, 100);
        }
        else {
            this.showHelpTooltip();
        }
    }

    showHelpTooltip() {
        this.attributeDetailWidget.hide();

        this.$editor.tooltip({
            trigger: 'focus',
            html: true,
            title: HELP_TEXT,
            placement: 'bottom',
            offset: "0,30"
        });

        this.$editor.tooltip('show');
    }

    getClickIndex(pos) {
        let clickIndex = pos.offset - pos.textNode.startOffset;

        let curNode = pos.textNode;

        while (curNode.previousSibling) {
            curNode = curNode.previousSibling;

            if (curNode.name === 'reference') {
                clickIndex += curNode._attrs.get('notePath').length + 1;
            } else {
                clickIndex += curNode.data.length;
            }
        }

        return clickIndex;
    }

    async loadReferenceLinkTitle($el, href) {
        const {noteId} = linkService.parseNavigationStateFromUrl(href);
        const note = await froca.getNote(noteId, true);

        const title = note ? note.title : '[missing]';

        $el.text(title);
    }

    async refreshWithNote(note) {
        await this.renderOwnedAttributes(note.getOwnedAttributes(), true);
    }

    async renderOwnedAttributes(ownedAttributes, saved) {
        // attrs are not resorted if position changes after the initial load
        ownedAttributes.sort((a, b) => a.position - b.position);

        let htmlAttrs = (await attributeRenderer.renderAttributes(ownedAttributes, true)).html();

        if (htmlAttrs.length > 0) {
            htmlAttrs += "&nbsp;";
        }

        this.textEditor.setData(htmlAttrs);

        if (saved) {
            this.lastSavedContent = this.textEditor.getData();

            this.$saveAttributesButton.fadeOut(0);
        }
    }

    async createNoteForReferenceLink(title) {
        const {note} = await noteCreateService.createNoteWithTypePrompt(this.notePath, {
            activate: false,
            title: title
        });

        return note.getBestNotePathString();
    }

    async updateAttributeList(attributes) {
        await this.renderOwnedAttributes(attributes, false);
    }

    focus() {
        this.$editor.trigger('focus');

        this.textEditor.model.change( writer => {
            const positionAt = writer.createPositionAt(this.textEditor.model.document.getRoot(), 'end');

            writer.setSelection(positionAt);
        } );
    }

    entitiesReloadedEvent({loadResults}) {
        if (loadResults.getAttributeRows(this.componentId).find(attr => attributeService.isAffecting(attr, this.note))) {
            this.refresh();
        }
    }
}
