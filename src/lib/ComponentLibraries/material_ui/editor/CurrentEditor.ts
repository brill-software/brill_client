// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.

/**
 * Keeps a track of the last editor that had the focus or that the user performed some action with.
 * 
 * Simply uses a static variable to hold the editor id.
 * 
 * An Action can also be saved. This is used by the EditPopover to tell the PageEditor not
 * to save the page as the EditPopover has actioned the Save command.
 * 
 */

export class CurrentEditor {
    static UNKNOWN: string = "unknown"

    private static id: string = CurrentEditor.UNKNOWN
    private static action: string = ""
    
    static set(id: string) {
        CurrentEditor.id = id
    }

    static get(): string {
        return CurrentEditor.id
    }

    /**
     * The pane id or other information can be included in the editor id.
     * This method assumes the editor id is of the format <pane id>-<editor id>
     * 
     * @returns Everything up to the first dash.
     */
    static getPaneId(): string {
        const pos = CurrentEditor.id.indexOf("-")
        if (pos > 0) {
            return CurrentEditor.id.substr(0, pos)
        }
        return CurrentEditor.UNKNOWN
    }
    
    static setAction(action: string) {
        CurrentEditor.action = action
    }
    
    static getAction(): string {
        return CurrentEditor.action
    }
}