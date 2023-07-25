// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { CurrentEditor } from "./CurrentEditor"
import { TopicUtils } from "lib/utils/TopicUtils"
import withStyles from "@mui/styles/withStyles"

/**
 * Image Preview component.
 * 
 */

interface Props {
    id: string
    theme: Theme
    fileName: string
    subscribeToTopic: string
    [propName: string]: any
}

interface State {
    image: string
}

class ImagePreview extends Component<Props, State> {
    token: Token
    tokenCmd: Token
    textChanged: boolean = false
    originalXhtml: string

    constructor(props: Props) {
        super(props)
        this.state = {image: ""}
    }

    componentDidMount() {
        MB.setCurrentApp(TopicUtils.getAppName(this.props.subscribeToTopic))
        const imageTopic = this.props.subscribeToTopic.replace("file:/", "image:/")
        this.token = MB.subscribe(imageTopic, 
            (topic, image) => this.dataLoadedCallback(topic, image), (topic, error) => this.errorCallback(topic, error))
        this.tokenCmd = MB.subscribe(`tabBarPane.editor.${this.props.id}`, 
            (topic, command) => this.commandCallback(topic, command), (topic, error) => this.errorCallback(topic, error))
        CurrentEditor.set(this.props.id)
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
        MB.unsubscribe(this.tokenCmd)
    }
    
    dataLoadedCallback(topic: string, image: string) {
        this.setState({image: image})
    }

    commandCallback(topic: string, command: string) {
        CurrentEditor.set(this.props.id)
    }
 
    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    render() {
        const {id, theme, classes, fileName, subscribeToTopic, ...other} = this.props
        if (!this.state.image) {
            return null
        }
        return (
            <img className={classes.root} src={this.state.image} alt="" {...other} />
        )
    }

    static defaultStyles(theme: Theme): any {
        return  { root: {display: "block", ...theme.components?.ImagePreview?.styleOverrides?.root }}
    }
}

export default withStyles(ImagePreview.defaultStyles, {withTheme: true})(ImagePreview)