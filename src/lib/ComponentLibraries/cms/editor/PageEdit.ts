// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import { PageComponent } from "lib/PageService/Page"

/**
 * Edit type
 */

export enum EditType {
    NO_MOVE = "NO MOVE",
    MOVE_BEFORE_DESTINATION = "MOVE BEFORE DESTINATION",
    MOVE_AFTER_DESTINATION = "MOVE AFTER DESTINATION",
    MOVE_INTO_DESTINATION = "MOVE INTO DESTINATION",
    PASTE_BEFORE_DESTINATION = "PASTE BEFORE DESTINATION",
    PASTE_OVER_DESTINATION = "PASTE OVER DESTINATION",
    PASTE_AFTER_DESTINATION = "PASTE AFTER DESTINATION",
    PASTE_INTO_DESTINATION_AT_BOTTOM = "PASTE INTO DESTINATION AT BOTTOM",
    PASTE_INTO_DESTINATION_AT_TOP = "PASTE INTO DESTINATION AT TOP",
    DELETE = "DELETE"
}

/**
 * Holds details of a Page Editor component move, paste or delete.
 */
export class PageEdit {
    sourcePath: string
    readonly moveType: EditType
    readonly destinationPath: string
    readonly pastedComponent: PageComponent | null

    constructor(sourcePath: string, moveType: EditType, destinationPath: string, pastedComponent: PageComponent | null = null) {
        this.sourcePath = sourcePath
        this.moveType = moveType
        this.destinationPath = destinationPath
        this.pastedComponent = pastedComponent
    }

    toString() {
        return `Edit: source = ${this.sourcePath} move type = ${this.moveType} destination = ${this.destinationPath}`
    }
 }