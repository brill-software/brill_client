// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, {Component} from "react"
import Xhtml from "lib/ComponentLibraries/material_ui/text/Xhtml"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { UnsavedChanges } from "lib/ComponentLibraries/material_ui/editor/UnsavedChanges"
import ConfirmDialog from "lib/ComponentLibraries/material_ui/dialog/ConfirmDialog"
import { CurrentEditor } from "./CurrentEditor"
import { TopicUtils } from "lib/utils/TopicUtils"
import { Base64 } from "js-base64"

/**
 * Preview of a XHTML page, including any unsaved changes.
 * 
 */

interface Props {
    id: string
    fileName: string
    subscribeToTopic: string
    publishToTopic: string
    publishTextChangedTopic?: string
    [propName: string]: any
}

interface State {
    text: string
}

export default class XhtmlPreview extends Component<Props, State> {
    unsubscribeToken: Token
    unsubscribeTokenCmd: Token
    unsubscribeTokenDisc: Token
    textChanged: boolean = false
    originalXhtml: string

    constructor(props: Props) {
        super(props)
        this.state = {text: ""}
    }

    componentDidMount() {
        MB.setCurrentApp(TopicUtils.getAppName(this.props.subscribeToTopic))
        this.unsubscribeToken = MB.subscribe(this.props.subscribeToTopic, (topic, content) => this.dataLoadedCallback(topic, content), (topic, error) => this.errorCallback(topic, error))
        this.unsubscribeTokenCmd = MB.subscribe(`tabBarPane.editor.${this.props.id}`, (topic, command) => this.commandCallback(topic, command), (topic, error) => this.errorCallback(topic, error))
        this.unsubscribeTokenDisc = MB.subscribe(`XhtmlPreview.discardChanges.${this.props.id}` , () => this.discardChanges(), (topic, error) => this.errorCallback(topic, error))
        CurrentEditor.set(this.props.id)
    }

    componentWillUnmount() {
        MB.unsubscribe(this.unsubscribeToken)
        MB.unsubscribe(this.unsubscribeTokenCmd)
        MB.unsubscribe(this.unsubscribeTokenDisc, true)
    }
    
    dataLoadedCallback(topic: string, content: any) {
        const xhtml = Base64.decode(content.base64)
        this.originalXhtml = xhtml
        if (UnsavedChanges.exists(this.props.subscribeToTopic)) {
            const change = UnsavedChanges.getChange(this.props.subscribeToTopic)
            MB.publish(this.props.publishTextChangedTopic, change.textChanged)
            if (change.textChanged) {
                this.textChanged = true
                this.setState({text: change.text})
                return
            }
        }
        this.setState({text: xhtml})
    }

    commandCallback(topic: string, command: string) {
        CurrentEditor.set(this.props.id)
        if (command === "save" && this.textChanged) {
            const content = {base64: Base64.encode(this.state.text)}
            MB.publish(this.props.publishToTopic, content)
            this.textChanged = false
            MB.publish(this.props.publishTextChangedTopic, false)
            UnsavedChanges.remove(this.props.subscribeToTopic)
            return
        }
        if (command === "revert" && this.textChanged) {
            MB.publish(`XhtmlPreview.discardChangesDialog.open.${this.props.id}`, 
            `Are you sure you want to discard your changes to ${this.props.fileName} and revert back to the last saved version?`)
        }
    }

    discardChanges() {
        this.setState({text: this.originalXhtml})
        this.textChanged = false
        MB.publish(this.props.publishTextChangedTopic, false)
        UnsavedChanges.remove(this.props.subscribeToTopic)
        MB.publish("statusBar.message", "reverted...")
    }
 
    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    render() {
        if (!this.state.text) {
            return null
        }
        const {id, theme, fileName, subscribeToTopic, publishToTopic, publishTextChangedTopic, ...other} = this.props
        return (
            <>
                <Xhtml id={id} style={{padding: "20px 35px 25px 31px"}} text={this.state.text} {...other} />                
                <ConfirmDialog title="Please confirm" prompt="" 
                    subscribeToTopic={`XhtmlPreview.discardChangesDialog.open.${this.props.id}`}
                    publishToTopic={`XhtmlPreview.discardChanges.${this.props.id}`} />
            </>
        )
    }
}