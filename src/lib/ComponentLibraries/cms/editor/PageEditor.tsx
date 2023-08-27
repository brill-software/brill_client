// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, { Component } from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { ComponentManager } from "lib/ComponentManager/ComponentManager"
import { Attributes, Page, PageComponent } from "lib/PageService/Page"
import { PageCloner } from "lib/ComponentLibraries/cms/editor/PageCloner"
import { MB, Token } from "lib/MessageBroker/MB"
import { IdGen } from "lib/utils/IdGen"
import { ErrorUtils } from "lib/utils/ErrorUtils"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { AreaTracker } from "lib/DndService/AreaTracker"
import { PageService } from "lib/PageService/PageService"
import { EdType, UnsavedChanges } from "../../material_ui/editor/UnsavedChanges"
import ConfirmDialog from "../../material_ui/dialog/ConfirmDialog"
import { UndoTracker } from "../../../PageService/UndoTracker"
import { ClipboardText } from "lib/utils/ClipboardText"
import { EditType, PageEdit } from "lib/ComponentLibraries/cms/editor/PageEdit"
import { Parser } from "lib/ComponentLibraries/cms/editor/Parser"
import DraggableBox, { CurrentSelection, DraggableBoxData } from "./DraggableBox"
import { CurrentEditor } from "lib/ComponentLibraries/material_ui/editor/CurrentEditor"
import LoadingIndicator from "lib/ComponentLibraries/html/LoadingIndicator"
import withStyles from "@mui/styles/withStyles"
import { Base64 } from "js-base64"

/**
 * The CMS Page Editor.
 * 
 */
  
interface Props {
    id: string
    classes: any
    fileName: string // e.g. home.json
    subscribeToTopic: string // e.g. file:/my_app/home.json
    publishToTopic: string   // e.g. file:/my_app/home.json
    publishTextChangedTopic: string
    currentSelectionTopic: string // Path of the currently selected component.
    [propName: string]: any
}

interface State {
    page: Page | undefined
    displayIds: boolean // When true, page is displayed with component outlines and ids.
    error: Error | undefined
}

/**
 * 
 * The Message Broker only supports a single default app. The PageEditor is used by the CMS app but
 * edits pages of other apps. To handle this the Message Broker default app is set to the app of the 
 * edited page and the CMS only uses fully qualified topic names the include the CMS app name.
 * 
 */
class PageEditor extends Component<Props, State> {
    tokens: Token[] = []
    boundEventHandler: EventListenerOrEventListenerObject
    ignoreNextLoadPageCallback: boolean = false
    areaTracker: AreaTracker
    initialText: string = ""
    changedText: string = ""
    changed: boolean = false
    undoTracker: UndoTracker = new UndoTracker()
    lastChangedPublished: boolean
    selectedJson: string = ""
    lastEditedComponentId: string
    selectedComponent: CurrentSelection

    constructor(props: Props) {
        super(props)
        this.state = { page: undefined, displayIds: true, error: undefined }
        this.areaTracker = new AreaTracker()
    }

    componentDidMount() {
        const jsonTopic = this.props.subscribeToTopic.replace("file:/", "json:/") // Load the page as JSON, rather than as a file.
        this.tokens.push(MB.subscribe(jsonTopic, (topic, page) => this.loadPageCallback(topic, page), (topic, error) => this.errorCallback(topic, error)))
        this.tokens.push(MB.subscribe(`tabBarPane.editor.${this.props.id}`, (topic, command) => this.commandCallback(topic, command), (topic, error) => this.errorCallback(topic, error)))
        this.tokens.push(MB.subscribe(`PageEditor.discardChanges.${this.props.id}`, (topic, yesOrNo) => this.discardChangesCallback(topic, yesOrNo), (topic, error) => this.errorCallback(topic, error)))
        this.tokens.push(MB.subscribe(this.props.currentSelectionTopic, (topic, currentSelection) => this.updateSelectedComponent(topic, currentSelection), (topic, error) => this.errorCallback(topic, error)))
        this.boundEventHandler = (event) => this.handleKeyDown(event)
        document.addEventListener("keydown", this.boundEventHandler, false)
        CurrentEditor.set(this.props.id)
    }

    componentWillUnmount() {
        if (this.changed || this.selectedJson) {
            UnsavedChanges.add(EdType.PAGE_EDITOR, this.props.subscribeToTopic, null, null, 
                this.changedText, 1, 1, this.changed, false, this.selectedJson)
        }
        document.removeEventListener("keydown", this.boundEventHandler)
        MB.unsubscribeAll(this.tokens)
    }

    /**
     * Handle keys for Save, Undo, Redo and Hide/Show Ids.
     */
     async handleKeyDown(event: any) {
        // Ignore if we're not the currently active editor.
        if (CurrentEditor.get() !== this.props.id) {
            return
        }
        // Ignore any keys that are for fields in pop up dialogs etc.
        if (event.target.nodeName !== "BODY") {         
            return
        }
        if (event.key === 's' && (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey)) {
            
            event.preventDefault()
            event.stopPropagation()
            this.save()
            return
        }
        if (event.key === 'z' && (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey)) {
            event.preventDefault()
            event.stopPropagation()
            if (event.shiftKey) {
                this.redo()
            } else {
                this.undo()
            }
            return
        }
        if (event.key === 'b' && (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey)) {
            event.preventDefault()
            event.stopPropagation()
            this.setState({displayIds: !this.state.displayIds})
            return
        }
        if (event.key === 'c' && (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey)) {
            event.preventDefault()
            event.stopPropagation()
            await ClipboardText.write(this.selectedComponent.componentJson)
            return
        }
        if (event.key === 'x' && (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey)) {
            event.preventDefault()
            event.stopPropagation()
            await ClipboardText.write(this.selectedComponent.componentJson)
            this.onDelete(this.selectedComponent.id)
            return
        }
        if (event.key === 'v' && (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey) && this.selectedComponent) {
            event.preventDefault()
            event.stopPropagation()
            if (this.selectedComponent.id) {
                await this.onPaste(EditType.PASTE_AFTER_DESTINATION, this.selectedComponent.id)
                MB.publish("statusBar.message", "pasted...")
            }   
            return
        }

        if (event.key === "Backspace") {
            event.preventDefault()
            event.stopPropagation()
            this.onDelete(this.selectedComponent.id)
            return
        }         
    }

    updateSelectedComponent(topic: string, currentSelection: CurrentSelection) {
        this.selectedComponent = currentSelection
    }

    async loadPageCallback(topic: string, page: Page) {
        try {
            if (this.ignoreNextLoadPageCallback) {
                this.ignoreNextLoadPageCallback = false
                return
            }

            // Check to see if the file has been deleted.
            if (page === null) {
                MB.publish("statusBar.message", "deleted...")
                let attrs: Attributes = new Attributes()
                attrs["text"] = "Sorry but this page was deleted in another window. Please close this tab."
                page = new Page(undefined, "Error Page", undefined, new PageComponent("error", "material_ui/text/Typography", attrs))
                this.changed = false
            }

            if (this.changed) {
                return // Don't allow unsaved edits to be overwritten.
            }

            // Set the default app to the app that is to be edited.
            MB.setCurrentApp(PageService.getAppName(topic))

            if (page.rootComponent === undefined) {
                page = this.createInitialNewPage()
                let text = JSON.stringify(page, null, 4)
                this.changeEditorText(text)
            } else {
                this.resetEditor(JSON.stringify(page, null, 4))
            }

            if (UnsavedChanges.exists(this.props.subscribeToTopic)) {
                const change = UnsavedChanges.getChange(this.props.subscribeToTopic)
                this.changeEditorText(change.text)
                const newPage: Page = JSON.parse(this.changedText)

                const uniqueImports: Array<string> = PageService.getUniqueImports(page.rootComponent)
                // Import the page component modules in parallel. Await completion of all the imports before carrying on.
                await Promise.all(uniqueImports.map( async (moduleName: string) => {
                    await ComponentManager.loadComponent(moduleName)}))

                this.setState({page: newPage})
                UnsavedChanges.remove(this.props.subscribeToTopic)
                return
            }

            const uniqueImports: Array<string> = PageService.getUniqueImports(page.rootComponent)
            // Import the page component modules in parallel. Await completion of all the imports before carrying on.
            await Promise.all(uniqueImports.map( async (moduleName: string) => {
                await ComponentManager.loadComponent(moduleName)}))

            this.setState({page: page})
        } catch (error) {
            this.setState({error: ErrorUtils.cvt(error)})  
        }
    }

    createInitialNewPage(): Page {
        let errorBoundaryComponent =  new PageComponent("ErrorBoundary","react/ErrorBoundary", new Attributes())
        let divAttrs = new Attributes()
        divAttrs["text"] = "New page - drag and drop components from the Storybook onto here to build a new page."
        const divComponent = new PageComponent("Div","html/Div", divAttrs)
        let childArray = []
        childArray.push(divComponent) 
        errorBoundaryComponent.children = childArray
        return new Page(undefined, "New page.", "", errorBoundaryComponent)
    }


    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
        let attrs: Attributes = new Attributes()
        if (error.detail.startsWith("Failed to find file")) {
            attrs["text"] = "\nSorry but this page was deleted in another window. Please close this tab."
        } else {
            attrs["text"] = error.title + " " + error.detail
        }
        const page = new Page(undefined, "Error Page", undefined, new PageComponent("error", "material_ui/text/Typography", attrs))
        this.changed = false
        this.setState({page: page}) 
    }

    /**
     * Converts page components to React Elements. Page components are wrapped with a DraggableBox. The style
     * pointerEvents: none is added to components to de-activate them. A caret (^) character can be added to 
     * the id to let mouse events through (used on some of the Component Library pages).
     *  
     * @param components PageComponent.
     * @returns React Element.
     */
    private createReactElements(component: PageComponent, path: string, index: number): React.CElement<any,any> {
        const module: any = ComponentManager.getAlreadyLoadedComponent(component.module)
        let attribs: any = {...component.attributes} // Do a shallow copy so that attributes can be modified without changing the page.

        // Add a key attribute if there isn't already one, so that components don't keep getting re-drawn.
        if (!attribs["key"]) {
            attribs["key"] = component.id
        }

        if (component.children === undefined || component.children.length === 0) {
            // Disable mouse events on the component, unless id contains a caret (^) character.
            if (!component.id.includes("^")) {
                if (!attribs["style"]) {
                    attribs["style"] = {pointerEvents: "none"}
                } else {
                    let style = {...attribs.style}
                    style["pointerEvents"] = "none"
                    attribs.style = style
                }
            }
            const componentPath = path + component.id
            const boxRef: React.RefObject<any> = React.createRef()
            if (module === undefined || module.default === undefined) {
                console.error("Module defualt is undefined!!!!!")
                return <div style={{color: "red"}}>Invalid Page Component: Can't load module {component.module} , id: {component.id}</div>
            }
            let element = React.createElement(module.default, attribs)
            this.areaTracker.addArea(componentPath, boxRef, index)
            const componentJson = JSON.stringify(component, null, 4)
            // Add an extra unique id to the key if the component was edited, so that React knows to re-draws it.
            const key = componentPath + ((component.id === this.lastEditedComponentId) ? "_" + IdGen.next() : "")
            return (      
                <DraggableBox id={componentPath} componentId={component.id} key={key} editorId={this.props.id} boxRef={boxRef}
                    displayIds={this.state.displayIds}
                    onStart={(event:  MouseEvent, data: DraggableBoxData) =>this.onStart(event, data)} 
                    onDrop={(event: MouseEvent, data: DraggableBoxData) => this.onDrop(event, data)}
                    onPaste={(pasteType: EditType, boxPath: string, json?: string) => this.onPaste(pasteType, boxPath, json)}
                    onDelete={(path: string) => this.onDelete(path)}
                    onSelect={(selectedJson: string) => this.onSelect(selectedJson)}
                    componentJson={componentJson}
                    container={false}
                    currentSelectionTopic={this.props.currentSelectionTopic}>
                    {element}
                </DraggableBox>
            ) 
        }
        path += component.id + "/"
        let childReactElements: Array<React.CElement<any,any>> = new Array<React.CElement<any,any>>()
        for (let i = 0; i < component.children.length; i++) {
            const childReactElement = this.createReactElements(component.children[i], path, i) // Recursive call
            childReactElements.push(childReactElement)
        }
        const containerRef: React.RefObject<any> = React.createRef()
        this.areaTracker.addArea(path, containerRef, index)

        const componentJson = JSON.stringify(component, null, 4)
        // Add an extra unique id to the key if the component was edited, so that React knows to re-draws it.
        const key = path + ((component.id === this.lastEditedComponentId) ? "_" + IdGen.next() : "")
        return (
            <DraggableBox id={path} componentId={component.id} key={key} editorId={this.props.id} boxRef={containerRef}
                    displayIds={this.state.displayIds}
                    onStart={(event: MouseEvent, data: DraggableBoxData) => this.onStart(event, data)} 
                    onDrop={(event: MouseEvent, data: DraggableBoxData) => this.onDrop(event, data)}
                    onPaste={(pasteType: EditType, boxPath: string, json?: string) => this.onPaste(pasteType, boxPath, json)}
                    onDelete={(path: string) => this.onDelete(path)}
                    onSelect={(selectedJson: string) => this.onSelect(selectedJson)}
                    componentJson={componentJson}
                    container={true}
                    currentSelectionTopic={this.props.currentSelectionTopic}>
                    {React.createElement(module.default, attribs, childReactElements)}
            </DraggableBox>
        )
    }

    onStart(event: MouseEvent, data: DraggableBoxData) {
        this.areaTracker.captureAreasOnDragStart()
    }

    onDrop(event: MouseEvent, data: DraggableBoxData): boolean {
        const pageEdit: PageEdit = this.areaTracker.findMove(data.id, data.movedX, data.movedY)
        if (pageEdit.moveType === EditType.NO_MOVE || this.state.page === undefined) {
            return false
        }
        const cloner = new PageCloner()
        const newPage = cloner.clone(this.state.page, pageEdit, this.props.currentSelectionTopic)
        this.onPageChange(newPage)
        this.setState({page: newPage})
        MB.publish("statusBar.message", "moved...")
        return true
    }

    async onPaste(pasteType: EditType, boxPath: string, json: string | null = null) {
        if (this.state.page === undefined) {
            return
        }
        let pastedJson = json
        if (!pastedJson) {
            pastedJson = await ClipboardText.read()
            MB.publish("statusBar.message", "pasted...")
        }
        const pastedComponent = Parser.convertToPageComponent(pastedJson)
        this.lastEditedComponentId = pastedComponent.id
        const pageEdit: PageEdit = new PageEdit("", pasteType, boxPath, pastedComponent)
        const cloner = new PageCloner()
        const newPage = cloner.clone(this.state.page, pageEdit, this.props.currentSelectionTopic)
        this.onPageChange(newPage)
        this.setState({page: newPage})
    }

    onDelete(path: string) {
        if (this.state.page === undefined || path.length === 0) {
            return
        }
        const pageEdit: PageEdit = new PageEdit("", EditType.DELETE, path)
        const cloner = new PageCloner()
        const newPage = cloner.clone(this.state.page, pageEdit, this.props.currentSelectionTopic)
        this.onPageChange(newPage)
        this.setState({page: newPage})
        MB.publish("statusBar.message", "deleted...")
    }

    onSelect(selectedJson: string) {
        this.selectedJson = selectedJson
    }

    undo() {
        if (this.undoTracker.undoPossible()) {
            this.changeEditorText(this.undoTracker.undo(), false)
            this.setState({page: JSON.parse(this.changedText)})
            MB.publish("statusBar.message", "un-done...")
        }
    }

    redo() {
        if (this.undoTracker.redoPossible()) {
            this.changeEditorText(this.undoTracker.redo(), false)
            const newPage = JSON.parse(this.changedText)
            this.setState({page: newPage})
            MB.publish("statusBar.message", "re-done...")
        }
    }

    revert() {
        if (this.changed && this.initialText.length > 2) {
            MB.publish(`PageEditor.discardChangesDialog.open.${this.props.id}`,
            `Are you sure you want to discard your changes to ${this.props.fileName} and revert back to the last saved version?`)
        }
    }

    discardChangesCallback(topic: string, yesOrNo: string) {
        this.resetEditor(this.initialText)
        const newPage: Page = JSON.parse(this.initialText)
        MB.publish(`PageEditor.discardChangesDialog.open.${this.props.id}`, false)
        this.setState({page: newPage})
        MB.publish("statusBar.message", "reverted...")
    }

    save() {
        if (this.changed) {
            const content = {base64: Base64.encode(this.changedText)}
            this.resetEditor(this.changedText)  
            // Stop the publish from causing a re-render of the editor.
            this.ignoreNextLoadPageCallback = true
            MB.publish(this.props.publishToTopic, content)
            MB.publish("statusBar.message", "saved...")    
        }
    }

    commandCallback(topic: string, command: string) {
        CurrentEditor.set(this.props.id)
        switch (command) {
            case "undo":
                this.undo()
                break
            case "redo":
                this.redo()
                break
            case "revert":
                this.revert()
                break
            case "save":
                this.save()
                break
            case "showIds":
                this.setState({displayIds: true})
                break
            case "hideIds":
                this.setState({displayIds: false})
                break    
            default:
                MB.error(topic, new ErrorMsg("Page Editor error.", `Received unexpected command of ${command}`))
                break
        }
    }  

    /**
     * Sets the tab label to orange if the file has changed.
     */
    updateTabState() {
        if (this.lastChangedPublished === undefined || this.lastChangedPublished !== this.changed) {
            MB.publish(this.props.publishTextChangedTopic, this.changed)
            this.lastChangedPublished = this.changed
        }
    }

    /**
     * Resets the editor to the initial text, resets the undo tracker and resets the tab edit state.
     * 
     * @param initialText 
     */
    resetEditor(initialText: string) {
        this.initialText = initialText
        this.changedText = initialText
        this.undoTracker.reset(this.initialText)
        this.changed = false
        this.updateTabState()
    }

    /**
     * Changes this.changedText and also updates the undo tracker and the tab edit state.
     * 
     * @param newChangedText 
     * @param updateUndoTracker 
     */
    changeEditorText(newChangedText: string, updateUndoTracker: boolean = true) {
        if (updateUndoTracker) {
            this.undoTracker.addChange(newChangedText)       
        }
        this.changedText = newChangedText
        this.changed = this.initialText !== this.changedText
        this.updateTabState()
    }

    /**
     * Called when the page changes. Updates the editor text.
     * 
     * @param newPage 
     */
    onPageChange(newPage: Page) {
        CurrentEditor.set(this.props.id)
        const newChangedText = JSON.stringify(newPage, null, 4)
        this.changeEditorText(newChangedText)
    }

    render() {
        if (this.state.page === undefined) {
            return <LoadingIndicator />
        }  

        this.areaTracker.clear()
        const reactElements: React.CElement<any,any> = this.createReactElements(this.state.page.rootComponent, "/", 0)

        return (
            <div key="pageEdOuterDiv" style={{margin: "23px 10px 10px 10px"}}>    
                {reactElements}
                <ConfirmDialog title="Please confirm" prompt="" key="pageEdConfDialog"
                    subscribeToTopic={`PageEditor.discardChangesDialog.open.${this.props.id}`}
                    publishToTopic={`PageEditor.discardChanges.${this.props.id}`} />
            </div>
        )
    }

    static defaultStyles(theme: Theme): any {
        return {
            dashedBox: {
                border: "1px dashed #999",
                borderRadius: "3px",
                padding: "5px",
                cursor: "move",
                zIndex: "1"
              },
              solidBox: {
                border: "1px solid #0000e0",
                borderRadius: "3px",
                padding: "10px",
                cursor: "move"
              }
        }
    }
}

export default withStyles(PageEditor.defaultStyles)(PageEditor)