// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.

/**
 * UndoTracker - used by the PageEditor to track changes and support undo and redo operations.
 * 
 */

export class UndoTracker {

    private undoList: string[]
    private lastChangeIndex: number
    private maxRedoIndex: number

    constructor() {
        this.undoList = []
        this.lastChangeIndex = -1
        this.maxRedoIndex = -1
    }

    /**
     * Resets the tracker.
     * 
     * @param initialText 
     */
    reset(initialText: string) {
        this.undoList = [initialText]
        this.lastChangeIndex = 0
        this.maxRedoIndex = 0
    }

    /**
     * Checks that an undo can be performed. Must be called before doing undo().
     * 
     * @returns Returns true if an undo operation is possible.
     */
    undoPossible(): boolean {
        return this.lastChangeIndex > 0
    }

    /**
     * Returns the text for the previous state. Must only be called
     * if undoPossible() returns true.
     * 
     * @returns The editor text after doing an undo
     */
    undo(): string {
        this.lastChangeIndex--
        return this.undoList[this.lastChangeIndex]
    }

    /**
     * Checks that a redo can be performed. Must be called before doing redo().
     * 
     * @returns Returns true if a redo operation is possible.
     */
    redoPossible(): boolean {
        return this.lastChangeIndex < this.maxRedoIndex
    }

    /**
     * Returns the editor text after doing a redo. Must only be called
     * if redoPossible() returns true.
     * 
     * @returns The editor text after doing a redo.
     */
    redo(): string {
        this.lastChangeIndex++
        return this.undoList[this.lastChangeIndex]
    }

    /**
     * Adds the latest change to the undo list.
     * 
     * @param text 
     */
    addChange(text: string) {
        this.lastChangeIndex++
        this.undoList[this.lastChangeIndex] = text
        this.maxRedoIndex = this.lastChangeIndex
    }
}
