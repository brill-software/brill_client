// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Button as MuiButton, withStyles } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import Router from "lib/Router/Router"
import { ReactUtils } from "lib/utils/ReactUtils"
import { MB } from "lib/MessageBroker/MB"

/**
 * Cancel Button - based on the Material UI Button component.
 * 
 */

interface Props {
    theme: Theme
    classes: any
    startIcon?: string
    title: string
    endIcon?: string
    publishToTopic?: string
    action?: string
    route?: string
    [propName: string]: any
}

interface State {
}

class CancelButton extends Component<Props, State> {

    static defaultStyles(theme: Theme): any {
        return  {
            root: { ...theme.overrides?.CancelButton?.root }
        }
    }

    onClickHandler() {
        if (this.props.publishToTopic) {
            MB.publish(this.props.publishToTopic, this.props.action)
        }
        if (this.props.route) {
            if (this.props.routetoLowerCase() === "back") {
                Router.goBackToPreviousPage()
            } else {
                Router.goToPage(this.props.route)
            }      
        }
    }

    render() {
        const {theme, classes, startIcon, title, endIcon, route, publishToTopic, action, ...other} = this.props
        const startIconAttr = {startIcon: ReactUtils.resolveIcon(startIcon)}
        const endIconAttr = {endIcon: ReactUtils.resolveIcon(endIcon)}
        
        return (
            <div>
                <MuiButton className={classes.root} 
                    {...startIconAttr} {...endIconAttr} 
                    onClick={() => this.onClickHandler()}
                    {...other}>
                        {title}
                </MuiButton>
            </div>
        )
    }
}

export default withStyles(CancelButton.defaultStyles, { withTheme: true})(CancelButton)