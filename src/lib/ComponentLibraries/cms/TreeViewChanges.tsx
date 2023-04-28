// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {ChangeEvent, Component} from "react"
import { Menu, MenuItem, PopoverPosition, Tooltip, Typography, withTheme } from "@material-ui/core"
import { TreeView as MuiTreeView, TreeItem as MuiTreeItem } from "@material-ui/lab"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import ChevronRightIcon from "@material-ui/icons/ChevronRight"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import FixedSizeIcon from "lib/ComponentLibraries/material_ui/icon/FixedSizeIcon"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import IconButton from "lib/ComponentLibraries/material_ui/button/IconButton"
import { TopicUtils } from "lib/utils/TopicUtils"
import { IdGen } from "lib/utils/IdGen"

/**
 * TreeViewChanges - Displays the changes that have yet to be committed to the repository.
 * Display staged, changed and stashed folders and files.
 * 
 */

interface TreeViewIcon {
    type: "leaf" | "branch"
    matches: string
    iconName: string
    style: object
}

interface Button {
    iconName: string
    publishToTopic: string
    toolTip: string
    style: object
}

interface TreeViewButton {
    subType: string
    buttonList: Button[]
}

export interface TreeViewMixins {
    icons: TreeViewIcon[]
    buttons: TreeViewButton[]
}

class SavedState {
    expandedNodeIds: string[]
    constructor(expandedNodeIds: string[]) {
        this.expandedNodeIds = expandedNodeIds
    }
}

interface Props {
    id: string
    theme: Theme
    title: string
    subscribeToTopic: string
    publishToTopic: string
    selectedNodeId?: string   // Id of a node to select and display on initial display of the page.
    subscribeToSelectFileTopic: string // Used to change seleected file when user selects a tab.
    [propName: string]: any
}

interface State {
    treeData: Node
    initialSelectedId: string | undefined
    contextMenuMouseX: number | null
    contextMenuMouseY: number | null
    openCommitDialog: boolean
}

interface Node {
    id: string
    name: string
    tooltip: string
    type: string
    subType: string | undefined
    children?: Node[]
}

class MatchingIcon {
    name: string
    style: object
    constructor(name: string, style: object) {
        this.name = name
        this.style = style
    }
}

class TreeView extends Component<Props, State> {
    private static savedStateMap: Map<string, SavedState> = new Map<string, SavedState>()
    expandedNodeIds: string[]
    token: Token
    tocken2: Token
    firstLeaf: Node
    menuNodeId: string
    menuNodeType: string

    constructor(props: Props) {
        super(props)
        this.state = {treeData: {id: "", name: "", tooltip: "", type: "", subType: ""}, initialSelectedId: (this.props.selectedNodeId ?? " "),
                        contextMenuMouseX: null, contextMenuMouseY: null, openCommitDialog: false}
        // The Material UI TreeView component only takes notice of the 'defaultExpanded' attribute on first render. So the saved state has
        // to be restored here in the constructor, rather than the componentDidMount() method.
        const savedState = TreeView.savedStateMap.get(this.props.id)
        if (savedState) {
            this.expandedNodeIds = savedState.expandedNodeIds
            TreeView.savedStateMap.delete(this.props.id)
        } else {
            this.expandedNodeIds = this.props.defaultExpanded
        }
    }

    componentDidMount() {
        this.token = MB.subscribe(this.props.subscribeToTopic, 
            (topic, treeData) => this.dataLoadedCallback(topic, treeData), 
            (topic, error) => this.errorCallback(topic, error))
        if (this.props.subscribeToSelectFileTopic) {
            this.tocken2 = MB.subscribe(this.props.subscribeToSelectFileTopic, 
                (topic, fileTopic) => this.fileSelectedCallback(topic, fileTopic), 
                (topic, error) => this.errorCallback(topic, error))
        }   
    }    

    dataLoadedCallback(topic: string, treeData: Node) {
        if (this.props.title) {
            treeData.name = this.props.title
        }
        this.setState({treeData: treeData})
    }

    fileSelectedCallback(topic: string, fileTopic: string) {
        this.setState({initialSelectedId: fileTopic})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    componentWillUnmount() {
        TreeView.savedStateMap.set(this.props.id, new SavedState(this.expandedNodeIds))
        MB.unsubscribe(this.token)
        MB.unsubscribe(this.tocken2)
    }

    onClickHandler(event: React.MouseEvent, nodeId: string, nodeType: string): void | undefined {
        if (nodeType === "leaf" && this.props.publishToTopic) {
            this.setState({initialSelectedId: undefined})
            MB.publish(this.props.publishToTopic, nodeId)
        }
    }

    onContextMenu(event: React.MouseEvent, menuNodeId: string, menuNodeType: string) {
        event.preventDefault()
        event.stopPropagation()
        this.menuNodeId = menuNodeId
        this.menuNodeType = menuNodeType
        this.setState({contextMenuMouseX: event.clientX - 2, contextMenuMouseY: event.clientY -4})
    }

    handleContextMenuClose() {
        this.setState({contextMenuMouseX: null, contextMenuMouseY: null})
    }

    handleContextMenuItemClick(action: string) {
        console.log(action)
        switch (action) {
            case "discard":
                const restoreFileTopic = this.menuNodeId.replace("file:", "git:restore:")
                MB.sendRequest(restoreFileTopic, 
                    (topic, response) => this.fileRestored(topic, response), 
                    (topic, error) => this.errorCallback(topic, error))
                break
        }
        this.setState({contextMenuMouseX: null, contextMenuMouseY: null})
    }

    fileRestored(topic: string, response: any) {
        // Let the Resizable Panels component know so it can close any tabs.
        const restoredFileTopic = this.menuNodeId.replace("git:restore:", "file:",)
        MB.publish(this.props.publishToTopic, restoredFileTopic)
    }

    iconName(type: string) {
        if (type === "branch") {
            return "BookTwoTone"
        }
        return "/Icons/fixed/database-search.json"
    }

    /**
     * Uses the Theme to get the appropriate icon for the file type.
     * 
     */
    getMatchingIcon(node: Node): MatchingIcon {
        const {theme} = this.props

        if (theme.mixins?.TreeView?.icons) {
            for (let i = 0; i < theme.mixins.TreeView.icons.length; i++) {
                if (theme.mixins.TreeView.icons[i].type === node.type &&
                    node.id.search(theme.mixins.TreeView.icons[i].matches) !== -1) {
                        return new MatchingIcon(theme.mixins.TreeView.icons[i].iconName, theme.mixins.TreeView.icons[i].style)
                    }
            }
        }

        if (node.type === "branch") {
            return new MatchingIcon("FolderTwoTone", {color: "#aab2bf"})
        }
        return new MatchingIcon("InsertDriveFileTwoTone", {color: "#aab2bf"})
    }
    
    /**
     * Uses the Theme to get the appropriate buttons for the file type.
     * 
     */
    getButtons(node: Node) : any {
        const {theme} = this.props
        let elements : any = [];
        if (!theme.mixins?.TreeView?.buttons) {
            return elements
        }  
        for (const buttonsEntry of theme.mixins.TreeView.buttons) {
            if (buttonsEntry.subType === node.subType) {
                for (const button of buttonsEntry.buttonList) {
                    elements.push(
                        <IconButton key={IdGen.next()}
                            style={button.style} 
                            iconName={button.iconName} 
                            tooltip={button.toolTip} 
                            publishToTopic={button.publishToTopic.replace("{path}", TopicUtils.getPath(node.id))} />
                    )
                }
                return elements
            }
        }
    }

    onNodeToggle(event: ChangeEvent<{}>, nodeIds: string[]) {
        this.expandedNodeIds = nodeIds
    }

    renderTree(node: Node) {
        const icon: MatchingIcon = this.getMatchingIcon(node)
        let nodeName: JSX.Element
        if (node.subType && node.subType.indexOf("Deleted") >= 0) {
            nodeName = (
                <del>{node.name}</del>
            )
        } else if (node.subType && node.subType.indexOf("Conflicting") >= 0) {
            nodeName = (
                <div style={{color: "red", background: "yellow"}}>{node.name}</div>
            )
        }
        else {
            nodeName = (
                <>{node.name}</>
            )
        }

        return (
            <MuiTreeItem key={node.id} nodeId={node.id}
            onContextMenu={(event) => {this.onContextMenu(event, node.id, node.type)}}
            onIconClick={(event) => { this.onClickHandler(event, node.id, node.type)}}
            onLabelClick={(event) => { this.onClickHandler(event, node.id, node.type)}}
            label={
                    <div style={{display: 'flex',
                    alignItems: 'center'
                    }}>                     
                        <FixedSizeIcon style={icon.style} nameOrTopic={icon.name} />
                        <Tooltip title={node.tooltip}>
                            <Typography variant="body2" style={{fontWeight: 'inherit',
                                flexGrow: 1,cursor: "context-menu"}}>{nodeName}</Typography>
                        </Tooltip>
                        {this.getButtons(node)}
                    </div>} >
                {Array.isArray(node.children) ? node.children.map((childNode) => this.renderTree(childNode)) : null}
            </MuiTreeItem>
        )
    }

    render() {
        const {id, theme, subscribeToTopic, publishToTopic, selectedNodeId, subscribeToSelectFileTopic, defaultExpanded, ...other} = this.props       
        return (
            <div>
                <MuiTreeView
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    selected={this.state.initialSelectedId ?? " "}
                    defaultExpandIcon={<ChevronRightIcon />}
                    defaultExpanded={this.expandedNodeIds}
                    onNodeToggle={(event: ChangeEvent<{}>, nodeIds: string[]) => {this.onNodeToggle(event, nodeIds)}}
                    {...other}>
                        {this.renderTree(this.state.treeData)}
                </MuiTreeView>
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
                    <MenuItem onClick={() => this.handleContextMenuItemClick("discard")}>Discard Change</MenuItem>
                </Menu> 
            </div>
        )
    }
}

export default withTheme(TreeView)