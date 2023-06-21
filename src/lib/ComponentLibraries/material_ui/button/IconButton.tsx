// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import Tooltip from "@material-ui/core/Tooltip"
import { withStyles } from '@material-ui/core'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import Router from "lib/Router/Router"
import { IconUtils } from "lib/utils/IconUtils"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { Html } from "lib/utils/HtmlUtils"

/**
 * Icon Button component.
 * 
 */

interface Props {
    theme: Theme
    iconName: string
    tooltip: string
    publishToTopic: string
    action: object
    route?: string
    [propName: string]: any
}

interface State {
    muiIcon: boolean
    svgHtml: string
}

class IconButton extends Component<Props, State> {
    token: Token

    static defaultStyles(theme: Theme): any {
        return  { root: {
            height: "24px",
            width: "24px",
            fill: "#498ada",
            color: "#498ada",
            cursor: "pointer",
            marginLeft: "20px",
            ...theme.overrides?.IconButton?.root }}
    }   

    constructor(props: Props) {
        super(props)
        this.state = {muiIcon: false, svgHtml:""}  
    }

    componentDidMount() {
        const {iconName} = this.props
        //If iconName contains no slash and no '.', it's a MUI Icon name.
        const muiIcon: boolean = !(iconName && (iconName.indexOf("/") !== -1 || iconName.indexOf(".") !== -1))
        if (!muiIcon) {
            this.token = MB.subscribe(this.props.iconName, 
                (topic, base64SvgHtml) => this.dataLoadedCallback(topic, base64SvgHtml), 
                (topic, error) => this.errorCallback(topic, error))
        }
        this.setState({muiIcon: muiIcon})
    }

    dataLoadedCallback(topic: string, base64SvgHtml: any) {
        if (base64SvgHtml?.base64) {
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
        const {theme, classes, iconName, tooltip, publishToTopic, action, ...other} = this.props

        if (!iconName) {
            return (
                <div>?</div>
            )
        }

        if (!this.state.muiIcon) { 
            // SVG Icon
            if (this.state.svgHtml.length > 0) {
                return (
                    <div className={classes.root} {...other}>
                         <Tooltip title={tooltip}>
                            <div style={{height: "24px", width: "24px"}} onClick={event => this.onClickHandler(event)} 
                                dangerouslySetInnerHTML={{__html: Html.sanitize(this.state.svgHtml)}} />
                         </Tooltip>
                    </div>
                )
            } 
            return null 
        }    

        return (
            // Material-UI Icon
            <div className={classes.root} {...other}>
                <Tooltip title={tooltip}>
                    <div {...other}
                        onClick={event => this.onClickHandler(event)}>
                        {IconUtils.resolveIcon(iconName)}
                    </div>
                </Tooltip>
            </div>
            )
    }
}

export default withStyles(IconButton.defaultStyles, {withTheme: true})(IconButton)