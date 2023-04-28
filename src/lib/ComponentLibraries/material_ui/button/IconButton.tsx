// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import Tooltip from "@material-ui/core/Tooltip"
import { withStyles } from '@material-ui/core'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB } from "lib/MessageBroker/MB"
import Router from "lib/Router/Router"
import { ReactUtils } from "lib/utils/ReactUtils"

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
}

class IconButton extends Component<Props, State> {

    static defaultStyles(theme: Theme): any {
        return  { root: {
            color: "#498ada",
            cursor: "pointer",
            marginLeft: "20px",
            ...theme.overrides?.IconButton?.root }}
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

        return (
            <div className={classes.root}>
                <Tooltip title={tooltip}>
                    <div {...other}
                        onClick={event => this.onClickHandler(event)}>
                        {ReactUtils.resolveIcon(iconName)}
                    </div>
                </Tooltip>
            </div>
            )
    }
}

export default withStyles(IconButton.defaultStyles, {withTheme: true})(IconButton)