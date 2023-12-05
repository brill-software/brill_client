// © 2022 Brill Software Limited - Brill CMS, distributed under the MIT License.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { TopicUtils } from "lib/utils/TopicUtils"
import { IdGen } from "lib/utils/IdGen"
import { JsonParser } from "lib/utils/JsonParser"
import Editor from "lib/ComponentLibraries/material_ui/editor/TextEditor"
import CustomIcon from "lib/ComponentLibraries/material_ui/icon/CustomIcon"
import PageEditor from "lib/ComponentLibraries/cms/editor/PageEditor"
import { CLOSE_PANEL_TOPIC } from "lib/ComponentLibraries/cms/ResizablePanels"
import IconButton from "lib/ComponentLibraries/material_ui/button/IconButton"
import TabName, { DndTabData, TabNameDropZone } from "lib/ComponentLibraries/cms/TabName"
import XhtmlEditor from "lib/ComponentLibraries/material_ui/editor/XhtmlEditor"
import XhtmlPreview from "../material_ui/editor/XhtmlPreview"
import TextEditorActionIcons from "lib/ComponentLibraries/cms/editorIcons/TextEditorActionIcons"
import XhtmlEditorActionIcons from "./editorIcons/XhtmlEditorActionIcons"
import XhtmlPreviewActionIcons from "./editorIcons/XhtmlPreviewActionIcons"
import { UnsavedChanges } from "../material_ui/editor/UnsavedChanges"
import DiffEditor from "../material_ui/editor/DiffEditor"
import DiffEditorActionIcons from "./editorIcons/DiffEditorActionIcons"
import PagePreviewActionIcons from "./editorIcons/PagePreviewActionIcons"
import PagePreview from "../material_ui/editor/PagePreview"
import PageEditorActionIcons from "./editorIcons/PageEditorActionIcons"
import { CurrentEditor } from "../material_ui/editor/CurrentEditor"
import ImagePreview from "../material_ui/editor/ImagePreview"
import ImagePreviewActionIcons from "./editorIcons/ImagePreviewActionIcons"
import PageViewActionIcons from "./editorIcons/PageViewActionIcons"
import PageView from "../material_ui/editor/PageView"
import withStyles from "@mui/styles/withStyles"
import MarkdownViewerActionIcons from "./editorIcons/MarkdownViewerActionIcons"
import MarkdownViewer from "../material_ui/editor/MarkdownViewer"
import ThemeProvider from "../material_ui/theme/ThemeProvider"

/**
 * Brill CMS Edit Pane - this is the main control class that determines which editor is displayed.
 * 
 * Displays tabs for the files that are currently being edited. There's a bar with the file names and
 * for the currently selected tab, a second bar displaying the edit modes and icons for the current edit mode.
 * 
 * The document id passed to the editor (activeTabEditorId) is created using the Tab Id and Mode. e.g. 234-1 . 
 * The same document id is passed each time an editor is created for a tab and this is used to retrive any unsaved text.
 * 
 * Props:
 * 
 *   subscribeToTopic   Set to "cms.treeItem" to receive notifications of any files selected in the Tree View.
 * 
 */

 export interface TabBarPaneOverrides {
    tabsRoot: object
    modesRoot: object
    modeActive: object
    modeInactive: object
    commandIcon: object
}

const TREE_VIEW_SELECT_FILE = "treeView.selectFile"
interface Mode {
    name: string
    editor: string 
}

interface ModeBar {
    matches: string
    mode: Mode[]
}

export interface TabBarPaneMixins {
    modeBar: ModeBar[]
}

export class TabBarDropZone {
    private static over: boolean = false

    static setOver() {
        TabBarDropZone.over = true
    }

    static clearOver() {
        TabBarDropZone.over = false
    }

    static isOverZone(): boolean {
        return TabBarDropZone.over
    }
}
class Tab {
    id: string 
    fileTopic: string
    name: string
    mode: number // Current mode
    editor: string[] // Editor for each of the modes. THe main editors are the PageEditor, TextEditor, DiffEditor and XHTML Editor.
    schemasTopic: string[] // Schemas for when the type of the editor is TextEitor and the file type is json.
    constructor(fileTopic: string, name: string, mode: number) {
        this.id = IdGen.next()
        this.fileTopic = fileTopic
        this.name = name
        this.mode = mode
        this.editor = []
        this.schemasTopic = []
    }
}

// When the component is unmounted, the state is saved. When mounted again with the same id, the state is restored.
class SavedState {
    state: State
    tab: Tab[]
    activeEditorId: string
    activeDocumentId: string
    constructor(state: State, tab: Tab[], activeEditorId: string, activeDocumentId: string) {
        this.state = state
        this.tab = tab
        this.activeEditorId = activeEditorId
        this.activeDocumentId = activeDocumentId
    }
}

interface Props {
    id: string // Must be unique. Used to delete component when last edit window is closed.
    theme: any // TODO
    classes: any
    subscribeToTopic: string
    [propName: string]: any
}

interface State {
    numOfTabs: number
    selectedTab: number
    currentMode: number
}

class TabBarPane extends Component<Props, State> {
    private static savedStateMap: Map<string, SavedState> = new Map<string, SavedState>()
    unsubscribeToken: Token
    tab: Tab[] = []
    activeTabEditorId: string
    activeDocumentId: string

    constructor(props: Props) {
        super(props)
        this.state = {numOfTabs: 0, selectedTab: -1, currentMode: 0}
    }

    componentDidMount() {
        const savedState = TabBarPane.savedStateMap.get(this.props.id)
        if (savedState) {
            this.setState(savedState.state)
            this.tab = savedState.tab
            this.activeTabEditorId = savedState.activeEditorId
            this.activeDocumentId = savedState.activeDocumentId
            TabBarPane.savedStateMap.delete(this.props.id)
            // On a resotre, don't load the currently selected tree view file.
            MB.publish(this.props.subscribeToTopic, "")
            MB.publish("statusBar.message", "")
        }
        this.unsubscribeToken = MB.subscribe(this.props.subscribeToTopic, 
            (event, fileTopic) => this.dataLoadedCallback(event,fileTopic), 
            (topic, error) => this.errorCallback(topic, error))
        CurrentEditor.set(this.props.id + "-0")           
    }    

    componentWillUnmount() {
        TabBarPane.savedStateMap.set(this.props.id, new SavedState(this.state, this.tab, this.activeTabEditorId, this.activeDocumentId))
        MB.unsubscribe(this.unsubscribeToken)
    }

    dataLoadedCallback(topic: string, fileTopic: string) {
        if (fileTopic === "") {
            return
        }
        if (fileTopic === TabBarPane.BREAK_RECURSIVE_LOOP) {
            MB.publish("statusBar.message", "recursive loop detected in page...")
            return
        }

        // Ignore any Git Stash folders.
        if (fileTopic.startsWith("git:stashfolder:/")) {
            return
        }

        // Close any tabs for a file that's been deleted.
        if (fileTopic.startsWith("git:delete:")) {
            const fileId = fileTopic.replace("git:delete:", "file:")
            this.closeDeletedFileTabs(fileId)
            MB.publish("statusBar.message", "deleted...")
            return
        }

        // Add a new tab if the last used editor has the same pane id or we don't know or the pane is empty.
        const currentPaneId = CurrentEditor.getPaneId()
        if (this.props.id === currentPaneId || currentPaneId === CurrentEditor.UNKNOWN || this.tab.length === 0) {
            // Check to see if there is already a tab for the file
            for (const [i, tabEntry] of this.tab.entries()) {
                if (fileTopic === tabEntry.fileTopic) {
                    this.setState({selectedTab: i})
                    return
                }
            }

            // Load the file into a new tab.
            this.tab.push(new Tab(fileTopic, TopicUtils.getFileName(fileTopic), 0))
            this.setState({numOfTabs: this.tab.length, selectedTab: this.tab.length - 1})
            this.preventRecursiveLoop(topic, fileTopic)
        }
    }

    closeDeletedFileTabs(fileTopic: string) {
        // Create a new tab array and copy in the tabs we are going to keep.
        let tabDeleted = false
        let newTab: Tab[] = []
        let newSelectedTab = this.state.selectedTab
        for (const [i, tabEntry] of this.tab.entries()) {
            if (fileTopic !== tabEntry.fileTopic) {
                newTab.push(tabEntry)
            } else {
                tabDeleted = true
                if (newSelectedTab >= i) {
                    newSelectedTab--
                }
            }
        }     
        if (!tabDeleted) {
            return
        }
        this.tab = newTab
        if (this.tab.length === 0) {
            CurrentEditor.set(CurrentEditor.UNKNOWN)
            MB.publish(CLOSE_PANEL_TOPIC, this.props.id) // Tell MultiResizablePanels to remove this panel
        }   
        this.setState({numOfTabs: this.tab.length, selectedTab: newSelectedTab})
    }

    /**
     * Editing the Page Editor within the Page Editor causes a recursive loop that goes on forever.
     * This method detects and breaks any recusive loops.
     */
    private static lastFileTopic = ""
    private static sameFileAgainCount = 0
    private static SAME_FILE_AGAIN_LIMIT = 6
    private static BREAK_RECURSIVE_LOOP = "XXX Break recursive loop XXX"
    preventRecursiveLoop(topic: string, fileTopic: string) {
        if (fileTopic !== TabBarPane.lastFileTopic || fileTopic.indexOf("/Pages/") === -1) {
            TabBarPane.lastFileTopic = fileTopic
            TabBarPane.sameFileAgainCount = 0
            return
        }  
        if (TabBarPane.sameFileAgainCount++ >= TabBarPane.SAME_FILE_AGAIN_LIMIT) {
            TabBarPane.lastFileTopic = ""
            TabBarPane.sameFileAgainCount = 0
            MB.publish(topic, TabBarPane.BREAK_RECURSIVE_LOOP)
        }
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    handleClickOnCloseIcon(tabToClose: number, saveUnsavedChanges: boolean = false) {
        // Prevent any unsaved changes getting saved when the unmount method of the editor is called.
        if (!saveUnsavedChanges) {
            UnsavedChanges.setIgnoreNextAdd()
        }
        let newSelectedTab = this.state.selectedTab
        if (tabToClose < this.state.selectedTab || (tabToClose === this.state.selectedTab && tabToClose === this.tab.length - 1)) {
            newSelectedTab--
        }
        this.tab.splice(tabToClose, 1)
        if (this.tab.length === 0) {
            CurrentEditor.set(CurrentEditor.UNKNOWN)
            MB.publish(CLOSE_PANEL_TOPIC, this.props.id) // Tell MultiResizablePanels to remove this panel
        }
        this.setState({numOfTabs: this.tab.length, selectedTab: newSelectedTab})
    }

    handleSelectTab(event: React.MouseEvent, tabToSelect: number) {
        if (tabToSelect === this.state.selectedTab) {
            return
        }
        MB.publish(TREE_VIEW_SELECT_FILE, this.tab[tabToSelect].fileTopic)
        this.setState({selectedTab: tabToSelect})
    }

    getTabElements(): any {
        // const {classes} = this.props
        let tabElements = []
        for (const [i, tabInfo] of this.tab.entries()) {
            const documentId = tabInfo.id + "-" + tabInfo.mode
            tabElements.push(
                <TabName id={documentId} key={IdGen.next()} tabNumber={i} mode={tabInfo.mode}
                    name={tabInfo.name} 
                    fileTopic={tabInfo.fileTopic}
                    activeTab={(i === this.state.selectedTab)} 
                    onNameClick={(event: any, tabToSelect: number) => this.handleSelectTab(event, tabToSelect)} 
                    onCloseIconClick={() => this.handleClickOnCloseIcon(i)}
                    subscribeToTopic={`tabBarPane.textChanged.${documentId}`} />
            )
        }
        return tabElements
    }

    handleModeClick(event: React.MouseEvent, newMode: number) {
        this.tab[this.state.selectedTab].mode = newMode
        this.setState({currentMode: newMode})
    }

    getModeElements(): any {
        const {theme, classes} = this.props
        let modeElements = []
        if (this.state.selectedTab === -1 || theme.mixins.TabBarPane?.modeBar === undefined) {
            return null
        }
        
        const fileTopic = this.tab[this.state.selectedTab].fileTopic
        this.tab[this.state.selectedTab].editor = []
        this.tab[this.state.selectedTab].schemasTopic = []

        for (const entry of theme.mixins.TabBarPane.modeBar) {
            if (fileTopic.search(entry.matches) !== -1) {
                if (this.tab[this.state.selectedTab].mode >= entry.mode.length - 1) {
                    this.tab[this.state.selectedTab].mode = entry.mode.length - 1
                }
                // The editor Id is componsed of the current tab bar pane id, a dash and a unique editor id.
                this.activeTabEditorId = this.props.id + "-" + IdGen.next()
                this.activeDocumentId = this.tab[this.state.selectedTab].id + "-" + this.tab[this.state.selectedTab].mode
                for (const [index, m] of entry.mode.entries()) {
                    const modeClass = (index === this.tab[this.state.selectedTab].mode) ? classes.modeActive : classes.modeInactive
                    const key = this.activeDocumentId + "-" + index
                    modeElements.push(
                        <div key={key} className={modeClass} onClick={(event) => this.handleModeClick(event, index)}>{m.name} </div>
                    )
                    this.tab[this.state.selectedTab].editor.push(m.editor)
                    this.tab[this.state.selectedTab].schemasTopic.push((m.schemasTopic ? m.schemasTopic : ""))
                }
                return modeElements
            }
        }
        return (<div className={classes.modeActive}>TEXT</div>)
    }

    publishCommand(editorId: string, command: string) {
        MB.publish(`tabBarPane.editor.${editorId}`, command)
    }

    getEditorIcons(): any {
        const {theme} = this.props
        if (this.state.selectedTab === -1 || theme.mixins?.TabBarPane?.modeBar === undefined) {
            return null
        }
        const currentMode = this.tab[this.state.selectedTab].mode
        const fileName = this.tab[this.state.selectedTab].name
        const currentEditor = this.tab[this.state.selectedTab].editor[currentMode]

        switch (currentEditor) {
            case "TextEditor":
                return <TextEditorActionIcons key={IdGen.next()} fileName={fileName} publishToTopic={`tabBarPane.editor.${this.activeTabEditorId}`} />
            case "MarkdownViewer":
                return <MarkdownViewerActionIcons key={IdGen.next()} fileName={fileName} publishToTopic={`tabBarPane.editor.${this.activeTabEditorId}`} />
            case "DiffEditor":
                return <DiffEditorActionIcons key={IdGen.next()} fileName={fileName} publishToTopic={`tabBarPane.editor.${this.activeTabEditorId}`} />
            case "XhtmlEditor":
                return <XhtmlEditorActionIcons key={IdGen.next()} 
                        subscribeToTopic={`tabBarPane.editor.currentStyle.${this.activeTabEditorId}`} 
                        publishToTopic={`tabBarPane.editor.${this.activeTabEditorId}`} />
            case "XhtmlPreview":
                return <XhtmlPreviewActionIcons key={IdGen.next()} publishToTopic={`tabBarPane.editor.${this.activeTabEditorId}`} />
            case "PageEditor":
                return <PageEditorActionIcons key={IdGen.next()} publishToTopic={`tabBarPane.editor.${this.activeTabEditorId}`} />
            case "PagePreview":
                return <PagePreviewActionIcons key={IdGen.next()} publishToTopic={`tabBarPane.editor.${this.activeTabEditorId}`} />
            case "PageView":
                    return <PageViewActionIcons key={IdGen.next()} publishToTopic={`tabBarPane.editor.${this.activeTabEditorId}`} />
            case "ImagePreview":
                return <ImagePreviewActionIcons key={IdGen.next()} publishToTopic={`tabBarPane.editor.${this.activeTabEditorId}`} />
            default:
                return <IconButton key={IdGen.next()} iconName="SaveTwoTone" tooltip="Save - Cmd S" 
                        publishToTopic={`tabBarPane.editor.${this.activeTabEditorId}`} action={{command: "save"}} />
        }
    }

    /**
     * Returns the appropraite editor for the currently selected tab and selected mode.
     * 
     * In any one pane, there's only ever one editor loaded at a time. When the user selects a different
     * mode or different tab, the current editor is unloaded (unmounted) and a new editor loaded (mounted). 
     * 
     * Note that each editor must have a key attribute, otherwise the current editor won't get unmounted if the user 
     * switches to a tab that has the same editor.
     * 
     * @returns Returns the editor for the current tab and mode.
     */
    getEditor(): any {
        const {theme} = this.props
        if (this.state.selectedTab === -1 || theme.mixins.TabBarPane?.modeBar === undefined) {
            return null
        }
        const fileTopic = this.tab[this.state.selectedTab].fileTopic
        const fileName = this.tab[this.state.selectedTab].name
        const currentMode = this.tab[this.state.selectedTab].mode
        const currentEditor = this.tab[this.state.selectedTab].editor[currentMode]
        const schemasTopic = this.tab[this.state.selectedTab].schemasTopic[currentMode]

        switch (currentEditor) {
            case "TextEditor":
                return <Editor id={this.activeTabEditorId} key={this.activeTabEditorId}
                        fileName={fileName}
                        subscribeToTopic={fileTopic} publishToTopic={fileTopic}
                        subscribeToActionTopic={`tabBarPane.editor.${this.activeTabEditorId}`}
                        schemasTopic={schemasTopic}
                        publishTextChangedTopic={`tabBarPane.textChanged.${this.activeDocumentId}`} />
            case "MarkdownViewer":
                return (
                    <ThemeProvider themeTopic="json:/brill_cms/Themes/markdown_theme.json" id={this.activeTabEditorId} key={this.activeTabEditorId}>
                        <MarkdownViewer id={this.activeTabEditorId} key={this.activeTabEditorId}
                            fileName={fileName}
                            subscribeToTopic={fileTopic} publishToTopic={fileTopic}
                            subscribeToActionTopic={`tabBarPane.editor.${this.activeTabEditorId}`} />
                    </ThemeProvider> 
                )
            case "DiffEditor":
                return <DiffEditor id={this.activeTabEditorId} key={this.activeTabEditorId}
                        fileName={fileName}
                        subscribeToTopic={fileTopic} publishToTopic={fileTopic}
                        schemasTopic={schemasTopic}
                        publishTextChangedTopic={`tabBarPane.textChanged.${this.activeDocumentId}`} />
            case "material_ui/icon/CustomIcon":
                return <CustomIcon id={this.activeTabEditorId} key={this.activeTabEditorId} subscribeToTopic={fileTopic} />
            case "PageEditor":
                return <PageEditor id={this.activeTabEditorId} key={this.activeTabEditorId} 
                        fileName={fileName}
                        subscribeToTopic={fileTopic}
                        publishToTopic={fileTopic}
                        publishTextChangedTopic={`tabBarPane.textChanged.${this.activeDocumentId}`}
                        currentSelectionTopic={`tabBarPane.pageEditor.currentSelection.${this.activeTabEditorId}`} />
            case "XhtmlEditor":
                return <XhtmlEditor id={this.activeTabEditorId} key={this.activeTabEditorId} 
                        fileName={fileName}
                        subscribeToTopic={fileTopic} 
                        subscribeToActionTopic={`tabBarPane.editor.${this.activeTabEditorId}`}
                        publishToTopic={fileTopic}
                        publishCurrentStyleTo={`tabBarPane.editor.currentStyle.${this.activeTabEditorId}`} 
                        publishTextChangedTopic={`tabBarPane.textChanged.${this.activeDocumentId}`} />
            case "XhtmlPreview":
                return <XhtmlPreview id={this.activeTabEditorId} key={this.activeTabEditorId} 
                    fileName={fileName}
                    subscribeToTopic={fileTopic}
                    publishToTopic={fileTopic}
                    publishTextChangedTopic={`tabBarPane.textChanged.${this.activeDocumentId}`} />
            case "PagePreview":
                return <PagePreview id={this.activeTabEditorId} key={this.activeTabEditorId} 
                        fileName={fileName}
                        subscribeToTopic={fileTopic}
                        publishToTopic={fileTopic}
                        publishTextChangedTopic={`tabBarPane.textChanged.${this.activeDocumentId}`} />
            case "PageView":
                return <PageView id={this.activeTabEditorId} key={this.activeTabEditorId} 
                        fileName={fileName}
                        subscribeToTopic={fileTopic}
                        publishToTopic={fileTopic}
                        publishTextChangedTopic={`tabBarPane.textChanged.${this.activeDocumentId}`} />
            case "ImagePreview":
                return <ImagePreview id={this.activeTabEditorId} key={this.activeTabEditorId} 
                        fileName={fileName}
                        subscribeToTopic={fileTopic} />
            default:   
                return <div>Error: No editor available for this file type. {currentEditor}</div>
        }
    }
    
    onDragOver(event: any) {
        console.log("Drag Over")
        TabBarDropZone.setOver()
        event.preventDefault()
    }

    onDragLeave(event: any) {
        console.log("Drag Leave")
        TabBarDropZone.clearOver()
    }

    onDrop(event: any) {
        const dndTabData = JsonParser.parse(event.dataTransfer.getData("dnd_tab_data")) as DndTabData
        if (!dndTabData) {
            return
        }
        
        // Find if the drop is over another tab.
        let insertPos = -1
        for (const [i, tabInfo] of this.tab.entries()) {
            const tabNameId = tabInfo.id + "-" + tabInfo.mode
            if (tabNameId === TabNameDropZone.getTabNameId()) {
                insertPos = i
                break
            }
        }

        // Find if the drop is within the same pane
        let dragWithinSamePane = false
        let startPos = -1
        for (const [i, tabInfo] of this.tab.entries()) {
            const tabNameId = tabInfo.id + "-" + tabInfo.mode
            if (dndTabData.tabNameId === tabNameId) {
                dragWithinSamePane = true
                startPos = i
                break
            }
        }

        // Hanlde a drop within the same pane.
        if (dragWithinSamePane) {
            if (insertPos !== -1 && insertPos !== startPos && insertPos < startPos) {
                // Insert before the drop target.
                this.tab.splice(insertPos, 0, this.tab[startPos])
                this.tab.splice(startPos + 1, 1)
                this.setState({numOfTabs: this.tab.length, selectedTab: insertPos})
                return
            }
            if (insertPos !== -1 && insertPos !== startPos && insertPos >= startPos + 1 ) {
                // Insert after the drop target.
                this.tab.splice(insertPos + 1, 0, this.tab[startPos])
                this.tab.splice(startPos, 1)
                this.setState({numOfTabs: this.tab.length, selectedTab: insertPos})
                return
            }
                
            // Add to the end
            this.tab.push(this.tab[startPos])
            this.tab.splice(startPos, 1)
            this.setState({numOfTabs: this.tab.length, selectedTab: this.tab.length - 1})
            return
        } 

        // Its a drap from another pane.
        if (insertPos >= 0) {
            // Insert after a tab 
            this.tab.splice(insertPos, 0, new Tab(dndTabData.fileTopic, TopicUtils.getFileName(dndTabData.fileTopic), dndTabData.mode))
            this.setState({numOfTabs: this.tab.length, selectedTab: insertPos})
            return
        } 

        // Not over a tab, so add a new tab at the end.
        this.tab.push(new Tab(dndTabData.fileTopic, TopicUtils.getFileName(dndTabData.fileTopic), dndTabData.mode))
        this.setState({numOfTabs: this.tab.length, selectedTab: this.tab.length - 1})
    }

    /**
     * Publishes the current file topic to the TreeView when the user either clicks anywhere
     * on the modes bar or anywhere in the editor. This allows the TreeView to hightlight the
     * file that currently has the focus.
     * 
     * @param event 
     */
    outerDivOnClick(event: any) {
        if (this.state.selectedTab && this.tab && this.tab[this.state.selectedTab] && this.tab[this.state.selectedTab].fileTopic) {
            MB.publish(TREE_VIEW_SELECT_FILE, this.tab[this.state.selectedTab].fileTopic)
        }      
    }

    render() {
        const {id, theme, classes, subscribeToTopic, ...other} = this.props

        return (
            <div style={{height: "100%", display: "flex", flexDirection: "column"}} >
                <div className={classes.tabsRoot}
                    onDragOver={(event) => this.onDragOver(event)}
                    onDragLeave={(event) => this.onDragLeave(event)}
                    onDrop={(event) => this.onDrop(event)} {...other}>
                    {this.getTabElements()}
                </div>
                <div className={classes.modesRoot} {...other} onClick={event => this.outerDivOnClick(event)}>
                    {this.getModeElements()}
                    {this.getEditorIcons()}
                </div>
                {/* Overflow=scroll is required so that the edit window can be scrolled but this prevents dragging 
                components outside of the Page Editor pane. See DraggableBox description for more details. */}
                <div style={{height: `calc(100% - 48px)`, overflow: "scroll"}} onClick={event => this.outerDivOnClick(event)}>  
                    {this.getEditor()}
                </div>
            </div>
        )
    }

    static defaultStyles(theme: Theme): any {
        return  {
            tabsRoot: {
                height: "24px",
                width: "100%",
                background: "#e0e0e0",
                display: "flex",
                flexDirection: "row",
                ...theme.components?.TabBarPane?.styleOverrides?.tabsRoot
            },
            modesRoot: {
                height: "24px",
                width: "100%",
                background: "#c9c9c9",
                display: "flex",
                flexDirection: "row",
                ...theme.components?.TabBarPane?.styleOverrides?.modesRoot
            },
            modeActive: {
                color: "#498ada",
                paddingTop: "2px",
                paddingLeft: "10px",
                paddingRight: "10px",
                fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Noto Sans\", \"Ubuntu\", \"Droid Sans\", \"Helvetica Neue\", sans-serif",
                fontSize: "0.9rem",
                fontWeight: 800,
                ...theme.components?.TabBarPane?.styleOverrides?.modeActive
            },
            modeInactive: {
                color: "#498ada",
                paddingTop: "2px",
                cursor: "pointer",
                paddingLeft: "10px",
                paddingRight: "10px",
                fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Noto Sans\", \"Ubuntu\", \"Droid Sans\", \"Helvetica Neue\", sans-serif",
                fontSize: "0.9rem",
                fontWeight: 100,
                ...theme.components?.TabBarPane?.styleOverrides?.modeInactive
            },
            commandIcon: {
                color: "#498ada",
                cursor: "pointer",
                marginLeft: "20px",
                ...theme.components?.TabBarPane?.styleOverrides?.commandIcon
            }
        }
    }
}

export default withStyles(TabBarPane.defaultStyles, {withTheme: true})(TabBarPane)