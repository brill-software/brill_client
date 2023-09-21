// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.

/**
 * Holds details of an overlap between a dragged component and one of the areas on the page.
 */
export class Overlap {
    readonly path: string
    readonly index: number
    readonly aboveOrLeft: boolean

    constructor(path: string, index: number, aboveOrLeft: boolean) {
        this.path = path
        this.index = index
        this.aboveOrLeft = aboveOrLeft
    }
}

/**
 * Holds all the component and container overlaps for a page.
 */
export class Overlaps {
    containerArray: Array<Overlap> 
    componentArray: Array<Overlap>
    readonly dcPath: string

    constructor(dcPath: string) {
        this.containerArray = new Array<Overlap>()
        this.componentArray = new Array<Overlap>()
        this.dcPath = dcPath
    }

    /**
     * Adds an overlap to either the component or container overlap array.
     * 
     * @param path Path of the dragged component.
     * @param index Child index of the dragged component.
     * @param aboveOrToLeft True if the dragged component is above or to the left of the overlapped area.
     */
    add(path: string, index: number, aboveOrToLeft: boolean) {
        if (path.endsWith("/")) {
            this.containerArray.push(new Overlap(path, index, aboveOrToLeft))
        } else {
            this.componentArray.push(new Overlap(path, index, aboveOrToLeft))
        }
    }
}
