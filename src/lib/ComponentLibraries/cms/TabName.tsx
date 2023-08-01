// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import ConfirmDialog from "../material_ui/dialog/ConfirmDialog"
import { TabBarDropZone } from "./TabBarPane"
import withStyles from "@mui/styles/withStyles"

/**
 * Brill CMS Tab
 *
 */

export class DndTabData {
    readonly tabNameId: string
    readonly fileTopic: string
    readonly mode: number
    constructor(tabNameId: string, fileTopic: string, mode: number) {
        this.tabNameId = tabNameId
        this.fileTopic = fileTopic
        this.mode = mode
    }
}

export class TabNameDropZone {
    private static tabNameId: string = ""

    static setTabNameId(tabNameId: string) {
        TabNameDropZone.tabNameId = tabNameId
    }

    static clearTabNameId() {
        TabNameDropZone.tabNameId = ""
    }

    static getTabNameId(): string {
        return TabNameDropZone.tabNameId
    }
}

interface Props {
    id: string // Must be unique. Used to delete component when last edit window is closed.
    theme: Theme
    classes: any
    tabNumber: number
    mode: number
    name: string
    fileTopic: string
    activeTab: boolean
    onNameClick: Function
    onCloseIconClick: Function
    subscribeToTopic: string    // Provides a value true if the text has changed.
    [propName: string]: any
}

interface State {
    textChanged: boolean
}

class TabName extends Component<Props, State> {
    token: Token
    token2: Token


    constructor(props: Props) {
        super(props)
        this.state = {textChanged: false}
    }

    componentDidMount() {
        const {id, tabNumber} = this.props
        this.token = MB.subscribe(this.props.subscribeToTopic, 
            (topic, textChanged) => this.dataLoadedCallback(topic, textChanged), 
            (topic, error) => this.errorCallback(topic, error))

        this.token2 = MB.subscribe(`TabName.confirmDialog.ok.${id}.${tabNumber}`, 
            (topic, textChanged) => this.confirmCallback(topic, textChanged), 
            (topic, error) => this.errorCallback(topic, error))
    }    

    componentWillUnmount() {
        const {id, tabNumber} = this.props
        MB.publish(`TabName.confirmDialog.open.${id}.${tabNumber}`, false)
        MB.unsubscribe(this.token)
        MB.unsubscribe(this.token2, true)
    }

    dataLoadedCallback(topic: string, textChanged: boolean) {
        this.setState({textChanged: textChanged})
    }

    confirmCallback(topic: string, textChanged: boolean) {
        this.props.onCloseIconClick()
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    alertBeforeClosingTab(event: any) {
        const {id, tabNumber, name} = this.props
        MB.publish(`TabName.confirmDialog.open.${id}.${tabNumber}`,
            `Are you sure you want to close this tab and discard your changes to ${name} ?`)
    }

    onDragStart(event: any) {
        event.stopPropagation()
        const data = new DndTabData(this.props.id, this.props.fileTopic, this.props.mode)
        event.dataTransfer.setData("dnd_tab_data", JSON.stringify(data))
    }

    onDragEnd(event: any) {
        if (TabBarDropZone.isOverZone()) {
            this.props.onCloseIconClick(null, this.props.tabNumber, true)
        }
    }

    onDragOver(event: any) {
        TabNameDropZone.setTabNameId(this.props.id)
    }

    onDragLeave(event: any) {
        TabNameDropZone.clearTabNameId()
    }

    render() {
        const {id, classes, tabNumber, name, activeTab} = this.props
        const textChanged = this.state.textChanged
        const tabClass = activeTab ? classes.tabActive : classes.tabInActive
        const tabXClass = activeTab ? classes.tabActiveX : classes.tabInActiveX
        const tabWidth = this.calcTabWidth(name)

        if (textChanged) {
            return (
                <div style={{display: "flex", flexDirection: "row"}} key={this.props.id} draggable="true" 
                    onDragStart={(event) => this.onDragStart(event)} 
                    onDragEnd={(event) => this.onDragEnd(event)}
                    onDragOver={(event) => this.onDragOver(event)}
                    onDragLeave={(event) => this.onDragLeave(event)}
                    >
                        <div className={tabClass} style={{width: `${tabWidth}px`, color: "#eea733"}} onClick={(event) => this.props.onNameClick(event, tabNumber)}>{name} </div >
                        <div className={tabXClass} style={{color: "#eea733"}} onClick={(event) => this.alertBeforeClosingTab(event)}>&#10687;</div>
                        <ConfirmDialog subscribeToTopic={`TabName.confirmDialog.open.${id}.${tabNumber}`} title="Unsaved changes" prompt="" 
                                    publishToTopic={`TabName.confirmDialog.ok.${id}.${tabNumber}`} />
                </div>
            )
        } else {
            return (
                <div style={{display: "flex", flexDirection: "row"}} key={this.props.id} draggable="true" 
                onDragStart={(event) => this.onDragStart(event)}
                onDragEnd={(event) => this.onDragEnd(event)}
                onDragOver={(event) => this.onDragOver(event)}
                onDragLeave={(event) => this.onDragLeave(event)}
                >
                    <div className={tabClass} style={{width: `${tabWidth}px`}} onClick={(event) => this.props.onNameClick(event, tabNumber)}>{name} </div >
                    <div className={tabXClass} onClick={(event) => this.props.onCloseIconClick(event, tabNumber)}>&times;</div>
                </div> 
            )
        }
    }

    calcTabWidth(tabName: string): number {
        let result = 0
        for (let i = 0; i < tabName.length; i++) {
            if ((tabName[i] >= 'A' && tabName[i] <= 'Z') || tabName[i] === '_' ) {
                result += 13
            } else {
                result += 10
            }
        }
        return result
    }

    static defaultStyles(theme: Theme): any {
        return  {
            tabActive: {
                cursor: "pointer",
                height: "100%",
                width: "180px",
                background: "#c9c9c9",
                paddingLeft: "10px",
                fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Noto Sans\", \"Ubuntu\", \"Droid Sans\", \"Helvetica Neue\", sans-serif",
                fontSize: "1.05rem",
                fontWeight: 700,
                ...theme.components?.TabName?.styleOverrides?.tabActive
            },
            tabActiveX: {
                cursor: "pointer",
                background: "#c9c9c9",
                paddingRight: "10px",
                marginRight: "2px",
                fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Noto Sans\", \"Ubuntu\", \"Droid Sans\", \"Helvetica Neue\", sans-serif",
                fontSize: "1.05rem",
                fontWeight: 700,
                ...theme.components?.TabName?.styleOverrides?.tabActiveX
            },
            tabInActive: {
                cursor: "pointer",
                height: "100%",
                width: "200px",
                background: "#dadada",
                paddingLeft: "10px",
                fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Noto Sans\", \"Ubuntu\", \"Droid Sans\", \"Helvetica Neue\", sans-serif",
                fontSize: "1.05rem",
                fontWeight: 300,
                ...theme.components?.TabName?.styleOverrides?.tabInActive
            },
            tabInActiveX: {
                cursor: "pointer",
                background: "#dadada",
                paddingRight: "10px",
                marginRight: "2px",
                fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Noto Sans\", \"Ubuntu\", \"Droid Sans\", \"Helvetica Neue\", sans-serif",
                fontSize: "1.05rem",
                fontWeight: 300,
                ...theme.components?.TabName?.styleOverrides?.tabInActiveX
            }
        }
    }
}

export default withStyles(TabName.defaultStyles, {withTheme: true})(TabName)