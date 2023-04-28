// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.

/**
 * Unsaved editor changes tracker
 * 
 * This class tracks unsaved changes. When the user switches mode or tab and an editor is no longer visible, it's unmounted.
 * During the unmount, the add method of the UnsavedChanges claass is called to save the current state of the editor. This includes 
 * the position of the cursor, the undo / redo stack and any changes. Both TextEditor and XhtmlEditor changes are handled by this class.
 * The user can switch between the XhtmlEditor and TextEditor and the changes will be carried over including the cursor position.
 * 
 * The cursor position is stored in the sames way as is used by the Monaco editor. The Xhtml editor has to do some complex calculations
 * to convert a line number and column to and from a Draft-js block number and offset.
 * 
 */

export enum EdType {
    TEXT_EDITOR = "TextEditor", // Also used by the DiffEditor
    XHTML_EDITOR = "XhtmlEditor",
    PAGE_EDITOR = "PageEditor"
}
export class Change {
    editor: EdType               // TextEditor, XhtmlEditor or PageEditor.
    model: any                   // The Monaco Model for TextEditor changes. 
    viewState: any               // The Monaco or Draft-js view state.
    text: string                 // The text including any markup.
    cursorLineNumber: number     // The line number within the text of the cursor. The first line is line 1.
    cursorColumn: number         // The column number of the cursor. The first column is 1.
    textChanged: boolean         // True if the text has been modified.
    externalChangesMade: boolean // True if changes include possible unsupported tags.
    selectedText: string         // Selected text.
    
    constructor(editor: EdType, model: any, viewState: any, text: string, cursorLineNumber: number, cursorColumn: number, 
                textChanged: boolean, externalChangesMade: boolean, selectedText: string) {
        this.editor = editor
        this.model = model
        this.viewState = viewState
        this.text = text
        this.cursorLineNumber = cursorLineNumber
        this.cursorColumn = cursorColumn
        this.textChanged = textChanged
        this.externalChangesMade = externalChangesMade
        this.selectedText = selectedText
    }
}
export class UnsavedChanges {

    // Map with the file topic as the key and the value containing the model, view state etc.
    private static map: Map<string, Change> = new Map<string, Change>()
    private static ignoreNextAdd: boolean = false

    /**
     * When the user closes a tab that has unsaved changes, this method is called to
     * prevent the unsaved changes getting saved.
     */
    static setIgnoreNextAdd() {
        UnsavedChanges.ignoreNextAdd = true
    }

    static add(editor: EdType, topic: string, model: any, viewState: any, text: string, cursorLineNumber: number, cursorColumn: number, 
               textChanged: boolean, externalChangesMade: boolean, selectedText: string) {
        if (UnsavedChanges.ignoreNextAdd) {
            UnsavedChanges.ignoreNextAdd = false
            return
        }
        if (topic) {
            UnsavedChanges.map.set(topic, new Change(editor, model, viewState, text, cursorLineNumber, cursorColumn, 
                textChanged, externalChangesMade, selectedText))
        }
    }

    static exists(topic: string): boolean {
        return topic !== undefined && UnsavedChanges.map.has(topic)
    }

    static getChange(topic: string): Change {
        const change: any = UnsavedChanges.map.get(topic)
        return change
    }

    static remove(topic: string) {
        if (UnsavedChanges.map.has(topic)) {
            UnsavedChanges.map.delete(topic)
        } else {
            console.warn(`Unable to remove unsaved changes for ${topic}`)
        }  
    }
}
