// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Tooltip, Typography } from "@mui/material"
import { TreeView as MuiTreeView, TreeItem as MuiTreeItem } from "@mui/lab"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import FixedSizeIcon from "lib/ComponentLibraries/material_ui/icon/FixedSizeIcon"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import IconButton from "../button/IconButton"
import { TopicUtils } from "lib/utils/TopicUtils"
import { IdGen } from "lib/utils/IdGen"
import withTheme from "@mui/styles/withTheme"

/**
 * TreeView - based on MUI TreeView.
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
    unsubscribeToken: Token
    unsubscribe2: Token
    firstLeaf: Node
    menuNodeId: string
    menuNodeType: string

    constructor(props: Props) {
        super(props)
        this.state = {treeData: {id: "", name: "", tooltip: "", type: "", subType: ""}, initialSelectedId: (this.props.selectedNodeId ?? ""),
                        contextMenuMouseX: null, contextMenuMouseY: null, openCommitDialog: false}
    }

    componentDidMount() {
        this.unsubscribeToken = MB.subscribe(this.props.subscribeToTopic, 
            (topic, treeData) => this.dataLoadedCallback(topic, treeData), 
            (topic, error) => this.errorCallback(topic, error))
        if (this.props.subscribeToSelectFileTopic) {
            this.unsubscribe2 = MB.subscribe(this.props.subscribeToSelectFileTopic, 
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
        MB.unsubscribe(this.unsubscribeToken)
        MB.unsubscribe(this.unsubscribe2)
    }

    onClickHandler(event: React.MouseEvent, nodeId: string, nodeType: string): void | undefined {
        if (nodeType === "leaf" && this.props.publishToTopic) {
            this.setState({initialSelectedId: undefined})
            MB.publish(this.props.publishToTopic, nodeId)
        }
    }

    // TODO - change icons based on file type.
    iconName(type: string) {
        if (type === "branch") {
            // return "Folder"
            return "BookTwoTone"
        }
        return "/Icons/fixed/database-search.json" // TODO
    }

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
            onClick={(event: any) => { this.onClickHandler(event, node.id, node.type)}}
            label={
                    <div style={{display: 'flex',
                    alignItems: 'center'
                    }}>                     
                        <FixedSizeIcon style={icon.style} nameOrTopic={icon.name} />
                        <Tooltip title={node.tooltip}>
                            <Typography variant="body2" style={{fontWeight: 'inherit',
                                flexGrow: 1,cursor: "pointer"}}>{nodeName}</Typography>
                        </Tooltip>
                        {this.getButtons(node)}
                    </div>} >
                {Array.isArray(node.children) ? node.children.map((childNode) => this.renderTree(childNode)) : null}
            </MuiTreeItem>
        )
    }

    render() {
        const {id, theme, subscribeToTopic, publishToTopic, selectedNodeId, subscribeToSelectFileTopic, ...other} = this.props       
        return (
            <div>
                <MuiTreeView
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    selected={this.state.initialSelectedId ?? ""}
                    defaultExpandIcon={<ChevronRightIcon />}
                    {...other}>
                        {this.renderTree(this.state.treeData)}
                </MuiTreeView>
            </div>
        )
    }
}

export default withTheme(TreeView as any)