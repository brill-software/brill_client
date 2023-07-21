// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, { Component } from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { Menu, MenuItem, PopoverPosition } from "@mui/material"
import { ClipboardText } from "lib/utils/ClipboardText"
import { EditType } from "lib/ComponentLibraries/cms/editor/PageEdit"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { CurrentEditor } from "lib/ComponentLibraries/material_ui/editor/CurrentEditor"
import EditPopover from "../EditPopover"
import withStyles from "@mui/styles/withStyles"

/**
 * Used by the Page Editor to place a draggable box around each component on a page.
 * 
 * Uses the new HTML 5 Drop and Drop API, which supports DnD between Page Editors and
 * across multiple browser windows. This wasn't possible using the old original API.
 * 
 * Drag of a component within a page is treated as a "move". A drag between pages is
 * treated as an "add".
 * 
 */

const defaultStyles: any = (theme: Theme) => {
    return {
        containerBox: {
            border: "1px dashed #0000f0",
            cursor: "context-menu",
            userSelect: "none",
            padding: "10px",
            zIndex: 0
        },
        componentBox: {
            border: "1px dotted #a00000",
            cursor: "context-menu",
            userSelect: "none",
            zIndex: 5
        },
        selectedContainerBox: {
            border: "1px solid #0000ff",
            cursor: "context-menu",
            userSelect: "none",
            padding: "10px",
            zIndex: 0
        },
        selectedComponentBox: {
            border: "1px solid #0000ff",
            cursor: "context-menu",
            userSelect: "none",
            zIndex: 5
        },
        noBox: {
            cursor: "context-menu",
            userSelect: "none",
        },
        editBarText: {
            color: "#498ada",
            background: "#c9c9c9",
            paddingLeft: "5px",
            paddingRight: "5px",
            fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Noto Sans\", \"Ubuntu\", \"Droid Sans\", \"Helvetica Neue\", sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "move",
            ...theme.overrides?.DraggableBoxData?.editBarText
        }
    }
}

export class CurrentSelection {
    readonly id: string
    readonly scrollIntoView: boolean
    readonly componentJson: string
    constructor(id: string, scrollIntoView: boolean, componentJson: string) {
        this.id = id
        this.scrollIntoView = scrollIntoView
        this.componentJson = componentJson
    }
}
export class DraggableBoxData {
    readonly id: string
    readonly movedX: number // The number of pixels the box has been moved right.
    readonly movedY: number // The number of pixels the box has been moved down.

    constructor(id: string, movedX: number, movedY: number) {
        this.id = id
        this.movedX = movedX
        this.movedY = movedY
    }
}

export type DraggableBoxEventHandler = (event: Event, data: DraggableBoxData) => void | false
export type DraggableBoxPasteHandler = (pasteType: EditType, boxPath: string, json?: string) => void
export type DraggableBoxDeleteHandler = (path: string) => void
export type DraggableBoxSelectHandler = (selectedJson: string) => void


class DndTransferData {
    readonly editorId: string
    readonly sourceId: string
    readonly startLeft: number
    readonly startTop: number
    readonly relX: number
    readonly relY: number

    constructor(editorId: string, sourceId: string, startLeft: number, startTop: number, relX: number, relY: number) {
        this.editorId = editorId
        this.sourceId = sourceId
        this.startLeft = startLeft
        this.startTop = startTop
        this.relX = relX
        this.relY = relY
    }
}
interface Props {
    id: string
    componentId: string
    theme: Theme
    classes: any
    editorId: string
    boxRef: React.RefObject<any>
    displayIds: boolean // Can be updated by PageEditor to hide/show outlines and ids.
    onStart: DraggableBoxEventHandler
    onDrop: DraggableBoxEventHandler
    onPaste: DraggableBoxPasteHandler
    onDelete: DraggableBoxDeleteHandler
    onSelect: DraggableBoxSelectHandler
    componentJson: string
    container: boolean
    currentSelectionTopic: string
    children: any
    [propName: string]: any
}

interface State {
    selected: boolean
    x: number
    y: number
    contextMenuMouseX: number | null
    contextMenuMouseY: number | null
    scrollIntoView: boolean
    popoverAnchorEl: any | null
}

class DraggableBox extends Component<Props, State> {
    token: Token
    relX: number
    relY: number
    timer: NodeJS.Timeout

    constructor(props: Props) {
        super(props)
        this.state = {selected: false, x: 0, y: 0, contextMenuMouseX: null, contextMenuMouseY: null,
            scrollIntoView: false, popoverAnchorEl: null }
    }

    componentDidMount() {
        this.token = MB.subscribe(this.props.currentSelectionTopic, 
            (topic, currentSelection) => this.selectionCallback(topic, currentSelection), 
            (topic, error) => this.errorCallback(topic, error))
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
    }

    onDragStart(event: any) {
        event.stopPropagation()
        const {offsetLeft, offsetTop} = this.props.boxRef.current
        this.relX = event.pageX - offsetLeft
        this.relY = event.pageY - offsetTop
        
        const data = new DraggableBoxData(this.props.id, 0, 0)
        this.props.onStart(event, data)

        const dndTransferData = new DndTransferData(this.props.editorId, this.props.id, offsetLeft, offsetTop, this.relX, this.relY)
        event.dataTransfer.setData("dnd_transfer_data", JSON.stringify(dndTransferData))
        event.dataTransfer.setData("component_json", this.props.componentJson)

        this.props.boxRef.current.style.opacity = "0.4"
        this.setState({ selected: true, x: event.pageX - this.relX, y: event.pageY - this.relY })
    }

    onDragEnd(event: any) {
        this.props.boxRef.current.style.opacity = "1.0"
    }

    onDragOver(event: any) {
        event.preventDefault()
    }

    onDrop(event: any) {
        const dndTransferData = JSON.parse(event.dataTransfer.getData("dnd_transfer_data")) as DndTransferData
        if (!dndTransferData) {
            console.warn("No transfer data")
            return
        }

        if (dndTransferData.editorId !== this.props.editorId) {
            this.handleDropFromAnotherPage(event)
        } else {
            this.handleDropOnSamerPage(event, dndTransferData)
        }

        event.preventDefault()
        event.stopPropagation()
    }

    /**
     * Handles the drag of a component within a page. It's treated as a Move.
     * The position calculations are performed by our own code using the various overlaps and
     * the heights and widths of the dragged component and overlapping components.
     */
    private handleDropOnSamerPage(event: any, dndTransferData: DndTransferData) {
        const x = event.pageX - dndTransferData.relX
        const y = event.pageY - dndTransferData.relY
        const data = new DraggableBoxData(dndTransferData.sourceId, x - dndTransferData.startLeft, y - dndTransferData.startTop)
        const worked = this.props.onDrop(event, data)
        // If we couldn't work out the move, try using the drop zone.
        if (!worked) {
            this.handleDropFromAnotherPage(event)
        }
    }

    /**
     * Handles drag from one page to another. It's like a Copy and Paste.
     * The position calculations are done using the cursor position and the drop target. 
     * This is not as accurate as using our own overlap code but works reasonably well.
     */
    private handleDropFromAnotherPage(event: any) {
        const droppedComponentJson = event.dataTransfer.getData("component_json")
        const bounding = event.target.getBoundingClientRect()
        const offset = bounding.y + (bounding.height / 2)
        const pasteBelow: boolean = (event.clientY - offset > 0)
        let editType
        if (this.props.container) {
            editType = pasteBelow ? EditType.PASTE_INTO_DESTINATION_AT_BOTTOM : EditType.PASTE_INTO_DESTINATION_AT_TOP
        } else {
           editType = pasteBelow ? EditType.PASTE_AFTER_DESTINATION : EditType.PASTE_BEFORE_DESTINATION
        }
        this.props.onPaste(editType, this.props.id, droppedComponentJson)
        MB.publish("statusBar.message", "copied...")
    }

    /**
     * Handles single and double clicks. For a double click, onClick gets called for the first click and then
     * a second time for the second click. A timer is used to work out whether it's a single or double click.
     */
    onClick(event: React.MouseEvent<any, MouseEvent>) {
        event.preventDefault()
        event.stopPropagation()
        CurrentEditor.set(this.props.editorId)
        if (event.detail === 1) {  // First click
            this.timer = setTimeout(() => this.singleClick(), 250)
        } else
        if (event.detail === 2) { // Double click
            clearTimeout(this.timer)
            this.doubleClick(event)
        }
    }

    singleClick() {   
        if (this.state.selected) {
            this.deselect()
        } else {
            this.select()
        }
    }

    doubleClick(event: React.MouseEvent<any, MouseEvent>) {
        if (!this.state.selected) {
            this.select()
        }
        this.setState({ popoverAnchorEl: event.currentTarget})
        MB.publish(`PageEditor.editDialog.open.${this.props.editorId}.${this.props.id}`,
            `Editing component in ${this.props.fileName}`)
        this.setState({contextMenuMouseX: null, contextMenuMouseY: null})
    }

    private select() {
        MB.publish(this.props.currentSelectionTopic, new CurrentSelection(this.props.id, false, this.props.componentJson))
        this.props.onSelect(this.props.componentJson)
    }

    private deselect() {
        MB.publish(this.props.currentSelectionTopic, new CurrentSelection("", false, this.props.componentJson))
        this.props.onSelect("")
    }

    onContextMenu(event: React.MouseEvent) {
        this.select()
        event.preventDefault()
        event.stopPropagation()
        this.setState({ contextMenuMouseX: event.clientX - 2, contextMenuMouseY: event.clientY - 4,
            popoverAnchorEl: event.currentTarget})
    }

    handleContextMenuClose() {
        this.setState({ contextMenuMouseX: null, contextMenuMouseY: null })
    }

    async handleContextMenuItemClick(event: any, action: string) {
        console.log(action)
        event.stopPropagation()
        switch (action) {
            case "edit":   
                MB.publish(`PageEditor.editDialog.open.${this.props.editorId}.${this.props.id}`,
                `Editing component in ${this.props.fileName}`)
                this.setState({contextMenuMouseX: null, contextMenuMouseY: null})
                break
            case "copy":
                await ClipboardText.write(this.props.componentJson)
                break
            case "cut":
                await ClipboardText.write(this.props.componentJson)
                this.props.onDelete(this.props.id)
                break    
            case "pasteBefore":
                this.props.onPaste(EditType.PASTE_BEFORE_DESTINATION, this.props.id)
                break
            case "pasteOver":
                this.props.onPaste(EditType.PASTE_OVER_DESTINATION, this.props.id)
                break
            case "pasteInto":
                this.props.onPaste(EditType.PASTE_INTO_DESTINATION_AT_BOTTOM, this.props.id)
                break
            case "pasteAfter":
                this.props.onPaste(EditType.PASTE_AFTER_DESTINATION, this.props.id)
                break
            case "delete":
                this.props.onDelete(this.props.id)
                break
            case "duplicate":
                await ClipboardText.write(this.props.componentJson)
                this.props.onPaste(EditType.PASTE_AFTER_DESTINATION, this.props.id)
                break
        }
        this.setState({ contextMenuMouseX: null, contextMenuMouseY: null })
    }

    handleEditSave(json: string) {
        this.props.onPaste(EditType.PASTE_OVER_DESTINATION, this.props.id, json)
    }

    selectionCallback(topic: string, currentSelection: CurrentSelection) {
        if (currentSelection.id === this.props.id && !this.state.selected) {
            this.props.onSelect(this.props.componentJson)
            this.setState({selected: true, scrollIntoView: currentSelection.scrollIntoView})
            return
        }  
        if (currentSelection.id !== this.props.id && this.state.selected) {
            this.setState({selected: false, scrollIntoView: false})
            return
        }
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    render() {
        const { id, classes, componentId, boxRef, displayIds, container , editorId, componentJson } = this.props
        let boxClass = classes.noBox
        if (displayIds) {
            if (!this.state.selected) {
                boxClass = (container ? classes.containerBox : classes.componentBox)
            } else {
                boxClass = (container ? classes.selectedContainerBox : classes.selectedComponentBox)
            }
        }

        return (  
            <div style={{height: "100%"}}>
                <div id={id} ref={boxRef} 
                    style={{height: "100%"}}
                    draggable="true" 
                    onDragStart={(event) => this.onDragStart(event)}
                    onDragEnd={(event) => this.onDragEnd(event)}
                    onDragOver={(event) => this.onDragOver(event)}
                    onDrop={(event) => this.onDrop(event)}
                    onClick={(event) => this.onClick(event)}
                    onContextMenu={(event) => { this.onContextMenu(event) }} 
                >
                    {displayIds && (
                        <div style={{ display: "flex", flexDirection: "row"}}>
                            <div className={classes.editBarText}>{componentId}</div>
                        </div>
                    )}
                    <div style={{height: "100%"}} className={boxClass}>
                        {this.props.children}
                    </div>
                </div>
                <Menu
                    keepMounted
                    open={this.state.contextMenuMouseY !== null}
                    onClose={() => this.handleContextMenuClose()}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        this.state.contextMenuMouseY !== null && this.state.contextMenuMouseY !== null
                            ? { top: this.state.contextMenuMouseY, left: this.state.contextMenuMouseX } as PopoverPosition
                            : undefined}
                >
                    <MenuItem onClick={(event) => this.handleContextMenuItemClick(event, "edit")}>Edit</MenuItem>
                    <MenuItem onClick={(event) => this.handleContextMenuItemClick(event, "copy")}>Copy</MenuItem>
                    <MenuItem onClick={(event) => this.handleContextMenuItemClick(event, "cut")}>Cut</MenuItem>
                    <MenuItem onClick={(event) => this.handleContextMenuItemClick(event, "pasteBefore")}>Paste Before</MenuItem>
                    <MenuItem onClick={(event) => this.handleContextMenuItemClick(event, "pasteOver")}>Paste Over</MenuItem>
                    <MenuItem onClick={(event) => this.handleContextMenuItemClick(event, "pasteInto")}>Paste Into</MenuItem>
                    <MenuItem onClick={(event) => this.handleContextMenuItemClick(event, "pasteAfter")}>Paste After</MenuItem>
                    <MenuItem onClick={(event) => this.handleContextMenuItemClick(event, "delete")}>Delete</MenuItem>
                    <MenuItem onClick={(event) => this.handleContextMenuItemClick(event, "duplicate")}>Duplicate</MenuItem>
                </Menu>
                <EditPopover
                    anchorEl={this.state.popoverAnchorEl}
                    title="Edit Component" prompt="" key="EdComponentDialog"
                    subscribeToTopic={`PageEditor.editDialog.open.${editorId}.${id}`}
                    publishToTopic={`PageEditor.saveChanges.${editorId}`}
                    componentJson={componentJson}
                    onSave={(json: string) => this.handleEditSave(json)}
                />
            </div>
        )
    }
}

export default withStyles(defaultStyles, { name: "DraggableBox"})(DraggableBox)