// © 2022 Brill Software Limited - Brill CMS, distributed under the MIT License.
import { Page, PageComponent } from "lib/PageService/Page"
import { EditType, PageEdit } from "lib/ComponentLibraries/cms/editor/PageEdit"
import { MB } from "lib/MessageBroker/MB"
import { CurrentSelection } from "./DraggableBox"

/**
 * Deep clones a page while performing an edit. For Undo and Redo to work, the clone has to be a deep clone 
 * otherwise edits would affect pages stored on the undo/redo stack.
 * 
 */
export class PageCloner {
    pageEdit: PageEdit
    componentToMove: PageComponent
    childArray: Array<PageComponent>
    childArrayPath: string
    insertionIndex: number = -1
    placeHolderCount: number // Used to ensure only one placeholder is inserted in case of duplicate ID's at a sibling level.

    /**
     * Perfoms a deep clone of a page and in the process moves a component from one part of the tree to another or
     * performs a paste action.
     * 
     * The component ID's need to be unique among siblings. Otherwise a move/paste will be performed using the first
     * occurrance of the ID, which might not be the component the user intended. 
     * 
     * If the ID of a pasted component matches any of the siblings, the ID will be changed to make it unqiue.
     * 
     * @param page Page to be cloned.
     * @param pageEdit Details of the component to be moved.
     * @param currentSelectionTopic Used to set a copied or pasted component as the currently selected component.
     * @returns New page.
     */
    
    clone(page: Page, pageEdit: PageEdit, currentSelectionTopic: string): Page {

        // Is it an edit of the root component?
        if ("/" + page.rootComponent.id + "/" === pageEdit.destinationPath && 
                pageEdit.pastedComponent !== null &&
                pageEdit.moveType === EditType.PASTE_OVER_DESTINATION) {
            // No need to clone the page. Just create a new a page using the pasted component as the new root component.
            return new Page(page.$schema, page.pageDescrip, page.permission, pageEdit.pastedComponent) 
        }

        // Clone the page and insert a placeholder to take the moved/pasted component.
        this.pageEdit = pageEdit
        this.placeHolderCount = 0
        const rootComponent = this.cloneComponent(page.rootComponent, "/")

        // Replace the placeholder with the moved or pasted component.
        switch (pageEdit.moveType) {
            case EditType.MOVE_BEFORE_DESTINATION:
            case EditType.MOVE_INTO_DESTINATION:
            case EditType.MOVE_AFTER_DESTINATION:
                if (this.insertionIndex !== -1 && this.componentToMove) {
                    this.childArray[this.insertionIndex] = this.componentToMove
                } else {
                    console.warn("Move failed.")
                    return page
                }
               
                break
            case EditType.PASTE_BEFORE_DESTINATION:
            case EditType.PASTE_INTO_DESTINATION_AT_BOTTOM:
            case EditType.PASTE_INTO_DESTINATION_AT_TOP:
            case EditType.PASTE_OVER_DESTINATION:
            case EditType.PASTE_AFTER_DESTINATION:
                if (this.insertionIndex !== -1 && pageEdit.pastedComponent) {
                    this.childArray[this.insertionIndex] = pageEdit.pastedComponent
                } else {
                    console.warn("Paste failed.")
                    return page
                }
                break
            case EditType.DELETE:
                // Nothing to do.
                break
            default:
                console.warn(`Unsupported edit type of ${pageEdit.moveType}`)
                return page
        }

        // See if the inserted component id clashes with any existing sibling id's
        this.preventDuplicateIds()

        // For a paste or move, set the currently selected component.
        if (this.insertionIndex !== -1 && (this.componentToMove || pageEdit.pastedComponent)) {
            let componentPath = this.childArrayPath + this.childArray[this.insertionIndex].id
            const child = this.childArray[this.insertionIndex]
            if (child.children && child.children.length > 0) {
                componentPath += "/"
            }
            const componentJson = pageEdit.pastedComponent ? JSON.stringify(pageEdit.pastedComponent) : "{}"
            MB.publish(currentSelectionTopic , new CurrentSelection(componentPath, true, componentJson))
        }
        return new Page(page.$schema, page.pageDescrip, page.permission, rootComponent) 
    }

    /**
     * Checks to see if any siblings have the same ID as the inserted component
     * @returns True if there's a duplicate.
     */
    isDuplicateId(): boolean {
        for (let i = 0; i < this.childArray.length; i++) {
            if (i !== this.insertionIndex && this.childArray[i].id === this.childArray[this.insertionIndex].id) {
                return true
            }
        }
        return false
    }

    /**
     * Try creating a unique ID by stripping everything after the last dash and adding the count number.
     * 
     * @param count Attempt number
     * @returns 
     */
    generateNewId(count: number) {
        let newId = this.childArray[this.insertionIndex].id
        const pos = newId.lastIndexOf("-")
        if (pos >= 0 ) {
            newId = newId.substring(0, pos)
        }
        return newId + "-" + count
    }

    preventDuplicateIds() {
        if (this.pageEdit.moveType === EditType.DELETE) {
            return // There won't be any duplicate ids if its a delete.
        }
        let count = 1
        while (this.isDuplicateId()) {
            this.childArray[this.insertionIndex].id = this.generateNewId(count++)
        }
    }

    private cloneComponent(component: PageComponent, path: string): PageComponent {
        const newAttribs = this.deepClone(component.attributes)
        let newComponent = new PageComponent(component.id, component.module, newAttribs)
        
        // When a PASTE INTO occurs, a new child array needs to be created if there isn't already one.
        if (component.children === undefined && this.pageEdit.moveType === EditType.PASTE_INTO_DESTINATION_AT_BOTTOM &&
            this.equalIgnoringTrailingSlash(path + component.id, this.pageEdit.destinationPath)) {
            component.children = []
        }

        if (component.children === undefined) {
            return newComponent
        }

        path += component.id + "/"
        let childComponents = new Array<PageComponent>()
        for (let i = 0; i < component.children.length; i++) {
            const child = this.cloneComponent(component.children[i], path) // Recursive call

            if (this.equalIgnoringTrailingSlash(path + component.children[i].id , this.pageEdit.sourcePath)) {
                this.componentToMove = child
                continue
            }

            if (this.equalIgnoringTrailingSlash(path + component.children[i].id, this.pageEdit.destinationPath) && this.placeHolderCount > 0 &&
                this.pageEdit.moveType !== EditType.PASTE_INTO_DESTINATION_AT_TOP && this.pageEdit.moveType !== EditType.PASTE_INTO_DESTINATION_AT_BOTTOM) {
                console.warn(`Page contains child components with the same ID. Duplicate ID's at a child level are not allowed. Path is ${this.pageEdit.destinationPath}`)
                childComponents.push(child)
                continue
            }

            if (this.equalIgnoringTrailingSlash(path + component.children[i].id, this.pageEdit.destinationPath)) {
                this.childArrayPath = path
                switch (this.pageEdit.moveType) {
                    case EditType.MOVE_BEFORE_DESTINATION:
                    case EditType.PASTE_BEFORE_DESTINATION:
                        this.childArray = childComponents
                        childComponents.push(new PageComponent("placeHolderBefore", "", {}))
                        this.placeHolderCount++
                        this.insertionIndex = childComponents.length - 1
                        childComponents.push(child)
                        break
                    case EditType.PASTE_OVER_DESTINATION:
                        this.childArray = childComponents
                        childComponents.push(new PageComponent("placeHolderOver", "", {}))
                        this.placeHolderCount++
                        this.insertionIndex = childComponents.length - 1
                        break
                    case EditType.MOVE_AFTER_DESTINATION:
                    case EditType.PASTE_AFTER_DESTINATION:
                        this.childArray = childComponents
                        childComponents.push(child)
                        childComponents.push(new PageComponent("placeHolderAfter", "", {}))
                        this.placeHolderCount++
                        this.insertionIndex = childComponents.length - 1
                        break
                    case EditType.MOVE_INTO_DESTINATION:
                    case EditType.PASTE_INTO_DESTINATION_AT_TOP:
                    case EditType.PASTE_INTO_DESTINATION_AT_BOTTOM:
                        childComponents.push(child)
                        break
                    case EditType.DELETE:
                        // Do nothing! Delete by not copying over the child.
                        break
                }
            } else {
                childComponents.push(child)
            }
        }

        if ((this.pageEdit.moveType === EditType.MOVE_INTO_DESTINATION  || this.pageEdit.moveType === EditType.PASTE_INTO_DESTINATION_AT_BOTTOM)
             && this.equalIgnoringTrailingSlash(path, this.pageEdit.destinationPath)) {
            childComponents.push(new PageComponent("placeHolderInto", "", {}))
            this.placeHolderCount++
            this.childArray = childComponents
            this.insertionIndex = childComponents.length - 1
        }

        if (this.pageEdit.moveType === EditType.PASTE_INTO_DESTINATION_AT_TOP && this.equalIgnoringTrailingSlash(path, this.pageEdit.destinationPath)) {
            childComponents.unshift(new PageComponent("placeHolderInto", "", {}))
            this.placeHolderCount++
            this.childArray = childComponents
            this.insertionIndex = 0
        }

        newComponent.children = childComponents
        return newComponent
    }

    equalIgnoringTrailingSlash(str1: string, str2: string): boolean {
        return (str1.endsWith("/") ? str1.substr(0, str1.length - 1) : str1) === (str2.endsWith("/") ? str2.substr(0, str2.length - 1) : str2)
    }

    /**
     * Deep clones an object using recursion. Used to clone attribute objects.
     * 
     * @param value Object to be cloned.
     * @returns The clone.
     */
    private deepClone<T extends object>(value: any): T {
        if (typeof value !== 'object' || value === null) {
            return value
        }
        if (value instanceof Set) {
            return new Set(Array.from(value, this.deepClone)) as T
        }
        if (value instanceof Map) {
            return new Map(Array.from(value, ([k, v]) => [k, this.deepClone(v)])) as T
        }
        if (value instanceof Date) {
            return new Date(value) as T
        }
        if (value instanceof RegExp) {
            return new RegExp(value.source, value.flags) as T
        }
        return Object.keys(value).reduce((acc, key) => {
            return Object.assign(acc, { [key]: this.deepClone(value[key]) })
        }, (Array.isArray(value) ? [] : {}) as T)
    }
}