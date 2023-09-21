// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React from "react"
import { Rectangle } from "./Rectangle"
import { Overlaps } from "./Overlaps"
import { EditType, PageEdit } from "lib/ComponentLibraries/cms/editor/PageEdit"

/**
 * Tracks the areas components occupy and works out drap and drop of components.
 * 
 */

/**
 * Holds details of an area on the page occupied by a container or component.
 * 
 */
class Area {
    boxRef: React.RefObject<any> // A React reference to the box surrounding a component or container.
    index: number      // The index of the component in the parents child array.
    rect: Rectangle    // Position from the top left corner of the page and the width / height.
 
    constructor(boxRef: React.RefObject<any>, index: number) {
        this.boxRef = boxRef
        this.index = index
        this.rect = new Rectangle(0, 0, 0, 0)
    }
}

class Offset {
    readonly left: number
    readonly top: number

    constructor(left: number, top: number) {
        this.left = left
        this.top = top
    }
}

/**
 * Tracks the areas of the page for the Page Editor. Used to work out drag and drop moves.
 * 
 * Each draggable component and container has an id that contains the path. e.g. /theme/error/boundary/title. When the
 * page is initially rendered the areas for each component and container are added to the area map. When a drag starts
 * the rectangle for each area is recorded. When the drag stops the areas that the component overlaps are found. These
 * are used to determine the move that the user wants to make.
 * 
 */
export class AreaTracker {
    private areaMap: Map<string,Area> // Index string is component or container path.

    constructor() {
        this.areaMap = new Map<string,Area>()
    }

    /**
     * Clears the area map.
     */
    clear() {
        this.areaMap = new Map<string,Area>()
    }

    /**
     * Called by the Page Editor to add each area to the area map.
     * 
     * @param path 
     * @param boxRef 
     * @param index 
     */
    addArea(path: string, boxRef: React.RefObject<any>, index: number) {
        this.areaMap.set(path, new Area(boxRef, index))
    }

    /**
     * Captures the rectange for each area on drag start.
     */
    captureAreasOnDragStart() {
        for (let [key, area] of this.areaMap.entries()) {
            if (area.boxRef.current === null) {
                console.error(`Area tracker error: Unable to get area rectangle for ${key}. Please check the page json for this component. Possible incorrect child component.`)
                continue
            }

            const parentOffset = this.getParentsOffset(area.boxRef.current)

            area.rect = new Rectangle(area.boxRef.current.offsetLeft + parentOffset.left, 
                                    area.boxRef.current.offsetTop + parentOffset.top,
                                    area.boxRef.current.offsetWidth, 
                                    area.boxRef.current.offsetHeight)
        }
    }

    private getParentsOffset(node: any): Offset {
        let left = 0
        let top = 0
        let currentNode = node.offsetParent
        while (currentNode !== null) {
            left += currentNode.offsetLeft
            top += currentNode.offsetTop
            currentNode = currentNode.offsetParent
        }
        return new Offset(left, top)
    }


    getArea(path: string): Area {
        const area: Area | undefined = this.areaMap.get(path)
        if (area === undefined) {
            throw new Error(`Area Tracker: Unable to find area ${path}`)
        }
        return area
    }

    /**
     * Finds the move that the user wishes to make. The move depends on which areas the
     * dragged component is over.
     * 
     * @param componentPath Path of the dragged component.
     * @param draggedX X amount dragged from start position.
     * @param draggedY Y amount dragged from start position.
     * @returns The move. (no move, move below, move above, move into a container)
     */
    findMove(componentPath: string, draggedX: number, draggedY: number): PageEdit {
        // Find the overlaps
        const dcStartArea = this.getArea(componentPath)
        const dcRect = new Rectangle(dcStartArea.rect.left + draggedX, dcStartArea.rect.top + draggedY, dcStartArea.rect.width, dcStartArea.rect.height)
        const overlaps: Overlaps = new Overlaps(componentPath)
        for (let [path,area] of this.areaMap.entries()) {
            if (dcRect.isSomeOverlap(area.rect)) {
                const aboveOrToLeft = dcRect.isAboveOrToLeft(area.rect)
                overlaps.add(path, area.index, aboveOrToLeft)
            }
        }

        // If there are no overlaps, the component has been dragged off the page.
        if (overlaps.componentArray.length === 0 && overlaps.containerArray.length === 0) {
            return new PageEdit("", EditType.NO_MOVE, "")
        }

        // If we're beween two components, insert the dragged compoment between them.
        if (overlaps.componentArray.length === 2 &&
            overlaps.componentArray[0].path !== overlaps.dcPath &&
            overlaps.componentArray[1].path !== overlaps.dcPath &&
            overlaps.componentArray[0].aboveOrLeft &&
            overlaps.componentArray[1].aboveOrLeft
            ) {
            return new PageEdit(componentPath, EditType.MOVE_AFTER_DESTINATION, overlaps.componentArray[0].path)
        }

        // If there are several component overlaps, try inserting above the first or after the last.
        if (overlaps.componentArray.length > 0) {
            // Find first where higherOrToLeft is true and not an overlap with the original position.
            for (let i = 0; i < overlaps.componentArray.length; i++) {
                if (overlaps.componentArray[i].aboveOrLeft && overlaps.componentArray[i].path !== overlaps.dcPath ) {
                    if (i > 0 && overlaps.componentArray[i - 1].path === overlaps.dcPath) {
                        return new PageEdit("", EditType.NO_MOVE, "")
                    }
                    return new PageEdit(componentPath, EditType.MOVE_BEFORE_DESTINATION, overlaps.componentArray[i].path)
                }
            }
            // Find last where higherOrToLeft is false and not an overlap with the start position.
            for (let i = overlaps.componentArray.length - 1; i >= 0; i--) {
                if (overlaps.componentArray[i].aboveOrLeft === false && overlaps.componentArray[i].path !== overlaps.dcPath ) {
                    return new PageEdit(componentPath, EditType.MOVE_AFTER_DESTINATION, overlaps.componentArray[i].path)
                }
            }

            // Overlaps start position, so no move.
            return new PageEdit("", EditType.NO_MOVE, "")
        }

        // Overlap is only with containers. See if its a move to a new container.
        for (let i = 0; i < overlaps.containerArray.length; i++) {
            if (!overlaps.dcPath.startsWith(overlaps.containerArray[i].path)) {
                return new PageEdit(componentPath, EditType.MOVE_INTO_DESTINATION, overlaps.containerArray[i].path)
            }
        }

        // Treat as a drag to the bottom of the components current container.
        if (overlaps.dcPath.startsWith(overlaps.containerArray[0].path)) {
            return new PageEdit(componentPath, EditType.MOVE_INTO_DESTINATION, overlaps.containerArray[0].path)
        }

        console.warn("Unable to work out the move.") // Help!
        return new PageEdit("", EditType.NO_MOVE, "")
    }

    /**
     * Logs the areas.
     */
    logAreas() {
        for (let [path,area] of this.areaMap.entries()) {
            console.log(`path = ${path} ${area.rect.toString()}`)
        }
    }

    /**
     * Logs the areas that the dragged component overlaps.
     */
    logOverlaps(componentPath: string, draggedX: number, draggedY: number) {
        console.log(`--- Finding overlaps for ${componentPath} draggedX = ${draggedX} draggedY = ${draggedY}`)
        const dcStartArea = this.getArea(componentPath)
        const dcRect = new Rectangle(dcStartArea.rect.left + draggedX, dcStartArea.rect.top + draggedY, dcStartArea.rect.width, dcStartArea.rect.height)      
        const overlaps: Overlaps = new Overlaps(componentPath)
        for (let [path,area] of this.areaMap.entries()) {
            if (dcRect.isSomeOverlap(area.rect)) {
                const aboveOrToLeft = dcRect.isAboveOrToLeft(area.rect)
                overlaps.add(path, area.index, aboveOrToLeft)
                console.log(`Overlaps ${path} index = ${area.index} higherOrToLeft = ${aboveOrToLeft}`)
            }
        }
        console.log("--- End of overlaps")
    }
}