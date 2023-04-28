// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, { Component } from "react"
import { Menu, MenuItem, PopoverPosition, Typography as MuiTypography, withTheme } from "@material-ui/core"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import FixedSizeIcon from "lib/ComponentLibraries/material_ui/icon/FixedSizeIcon"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"

/**
 * Workspace and Branch display. 
 * 
 */

interface Props {
    id: string
    theme: Theme
    title: string
    subscribeToTopic: string
    publishToTopic: string
    [propName: string]: any
}

interface State {
    text: String
    contextMenuMouseX: number | null
    contextMenuMouseY: number | null
}

class WorkspaceAndBranch extends Component<Props, State> {
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {text: "", contextMenuMouseX: null, contextMenuMouseY: null}
        }

    componentDidMount() {
        this.token = MB.subscribe(this.props.subscribeToTopic, 
            (topic, data) => this.dataLoadedCallback(topic, data), 
            (topic, error) => this.errorCallback(topic, error))
        MB.publish(this.props.publishToTopic, "view:/brill_cms/Pages/versionControl.json")
    }    

    dataLoadedCallback(topic: string, data: any) {
        this.setState({text: data.content.workspace+ "  [" + data.content.branch + "]"})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
    }

    onClick() {
        console.log("Workspace onClick")
        MB.publish(this.props.publishToTopic, "view:/brill_cms/Pages/versionControl.json")
    }

    onContextMenu(event: React.MouseEvent) {
        console.log("%%%%%% onContextMenu called")
        event.preventDefault()
        event.stopPropagation()
        this.setState({contextMenuMouseX: event.clientX - 2, contextMenuMouseY: event.clientY -4})
    }

    handleContextMenuItemClick(action: string) {
        console.log(action)
        switch (action) {
            case "setWorkspace":
                MB.publish("setWorkspace.dialog.open", "")
                break
            case "newBranch":
                MB.publish("newBranch.dialog.open", "")
                break
            case "switchBranch":
                MB.publish("switchBranch.dialog.open", "")
                break
            case "mergeBranch":
                MB.publish("mergeBranch.dialog.open", "")
                break      
            case "deleteBranch":
                MB.publish("deleteBranch.dialog.open", "")
                break
            case "checkoutBranch":
                MB.publish("checkoutBranch.dialog.open", "")
                break
            case "log":
                MB.publish("logBranch.dialog.fileName", "")
                MB.publish("logBranch.dialog.open", "")
                break
            case "rebaseBranch":
                MB.publish("rebaseBranch.dialog.open", "")
                break 
            case "pullBranch":
                MB.publish("pullBranch.dialog.open", "")
                break  
        }
        this.setState({contextMenuMouseX: null, contextMenuMouseY: null})
    }

    handleContextMenuClose() {
        this.setState({contextMenuMouseX: null, contextMenuMouseY: null})
    }

    render() {
        // const {id, theme, subscribeToTopic, publishToTopic, selectedNodeId, subscribeToSelectFileTopic, defaultExpanded, ...other} = this.props       
        return (
            <div  style={{display: "flex", flexDirection: "row"}} onClick={() => this.onClick()}>
                <FixedSizeIcon
                     nameOrTopic="FolderSpecialTwoTone"
                    tooltip="New/Change Branch" 
                    // publishToTopic="open.branch.dialog"
                     />
                <MuiTypography variant="body1" style={{fontWeight: 'inherit',flexGrow: 1,cursor: "context-menu"}}
                    onContextMenu={(event) => this.onContextMenu(event)}
                >
                    {this.state.text}
                </MuiTypography>
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
                    <MenuItem onClick={() => this.handleContextMenuItemClick("setWorkspace")}>Set Workspace</MenuItem>
                    <MenuItem onClick={() => this.handleContextMenuItemClick("newBranch")}>New Branch</MenuItem>  
                    <MenuItem onClick={() => this.handleContextMenuItemClick("switchBranch")}>Switch Branch</MenuItem>
                    <MenuItem onClick={() => this.handleContextMenuItemClick("mergeBranch")}>Merge Branch</MenuItem>
                    <MenuItem onClick={() => this.handleContextMenuItemClick("deleteBranch")}>Delete Branch</MenuItem>
                    <MenuItem onClick={() => this.handleContextMenuItemClick("checkoutBranch")}>Checkout Branch</MenuItem>
                    <MenuItem onClick={() => this.handleContextMenuItemClick("log")}>Commit Log</MenuItem>
                    <MenuItem onClick={() => this.handleContextMenuItemClick("rebaseBranch")}>Rebase</MenuItem>
                    <MenuItem onClick={() => this.handleContextMenuItemClick("pullBranch")}>Pull</MenuItem>
                </Menu>
            </div>
        )
    }
}

export default withTheme(WorkspaceAndBranch)