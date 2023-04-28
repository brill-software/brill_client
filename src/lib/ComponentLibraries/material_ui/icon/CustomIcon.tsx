// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { withTheme } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token  } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"

/**
 * Supports Custom Icons that are loaded from the Topic /Icons/custom/*.svg. The Icons are loaded as html.
 * 
 * Icons can be obtained from https://www.flaticon.com/ or you can create your own.
 */

interface Props {
    id: string
    theme: Theme
    subscribeToTopic: string
    [propName: string]: any
}

interface State {
    svgHtml: string
}

class CustomIcon extends Component<Props, State> { 
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {svgHtml: ""}
    }

    componentDidMount() {
        this.token = MB.subscribe(this.props.subscribeToTopic, (topic, base64SvgHtml) => this.dataLoadedCallback(topic, base64SvgHtml), (topic, error) => this.errorCallback(topic, error))
    }

    dataLoadedCallback(topic: string, base64SvgHtml: any) {
        if (base64SvgHtml.base64) {
            const svgHtml: string = atob(base64SvgHtml.base64)
            this.setState({svgHtml: svgHtml})
        }
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }    

    componentWillUnmount() {
        MB.unsubscribe(this.token)
    }

    render() {
        const {id, theme, subscribeToTopic, ...other} = this.props
            
        if (this.state.svgHtml.length > 0) {
            return (<span {...other} dangerouslySetInnerHTML={{__html: this.state.svgHtml}}/>)
        } 
        return null
    }
}

export default withTheme(CustomIcon)