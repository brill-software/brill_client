// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import Tooltip from "@material-ui/core/Tooltip"
import { withStyles } from '@material-ui/core'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import Router from "lib/Router/Router"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"

/**
 * Svg Icon Button component.
 * 
 */

interface Props {
    theme: Theme
    iconName: string
    tooltip: string
    subscribeToTopic: string
    publishToTopic: string
    action: object
    route?: string
    [propName: string]: any
}

interface State {
    svgHtml: string
}

class SvgIconButton extends Component<Props, State> {
    token: Token

    static defaultStyles(theme: Theme): any {
        return  { root: {
            height: "24px",
            width: "24px",
            fill: "#498ada",
            cursor: "pointer",
            marginLeft: "20px",
            ...theme.overrides?.SvgIconButton?.root }}
    }   

    constructor(props: Props) {
        super(props)
        this.state = {svgHtml:""}  
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

    onClickHandler(event: any) {
        event.preventDefault()
        event.stopPropagation()
        MB.publish(this.props.publishToTopic, this.props.action)
        if (this.props.route) {
            Router.goToPage(this.props.route)
        }
    }

    render() {
        if (!this.state.svgHtml) {
            return null
        }
        
        const {theme, classes, tooltip, publishToTopic, action, ...other} = this.props



        return (
            <div className={classes.root}>
                <Tooltip title={tooltip}>
                    <div {...other}
                        dangerouslySetInnerHTML={{__html: this.state.svgHtml}}
                        onClick={event => this.onClickHandler(event)}>
                    </div>
                </Tooltip>
            </div>
            )
    }
}

export default withStyles(SvgIconButton.defaultStyles, {withTheme: true})(SvgIconButton)