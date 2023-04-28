// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.

/**
 * A rectangle representing an area on the page.
 * 
 * The top left corner is position 0, 0. Left is the distance to the left hand edge of the page
 * in pixels. Top is the distance down from the top of the page in pixels.
 * 
 */
export class Rectangle {
    readonly left: number
    readonly top: number
    readonly width: number
    readonly height: number

    constructor(left: number, top: number, width: number, height: number) {
        this.left = left
        this.top = top
        this.width = width
        this.height = height
    }

    /**
     * Returns true if there's some overlap between 'this' rectangle and a second rectangle.
     * 
     * @param rect2 This second retangle to compare 'this' against.
     */
    isSomeOverlap(rect2: Rectangle): boolean {
        if (this.left > rect2.left + rect2.width) return false // Fully to the left?
        if (this.top + this.height < rect2.top) return false   // Fully above?
        if (this.top > rect2.top + rect2.height) return false  // Fully below?
        if (this.left + this.width < rect2.left) return false  // Fully to the right?
        return true; // There's some overlap.
    }

    /**
     * Returns true if 'this' rectangle is above or to the left of a second rectangle. 
     * 
     * @param react2 The second retangle to compare 'this' against.
     */
    public isAboveOrToLeft(rect2: Rectangle) : boolean {
        const centreLeft = this.left + this.width / 2
        const centreTop = this.top + this.height / 2
        const rect2CentreLeft = rect2.left + rect2.width / 2
        const rect2CentreTop = rect2.top + rect2.height / 2
        return (((rect2CentreLeft - centreLeft) * this.height) + ((rect2CentreTop - centreTop) * this.width) > 0)
    }

    public toString() {
        return `left = ${this.left}, top = ${this.top}, width = ${this.width}, height = ${this.height}`
    }  
}