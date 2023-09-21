// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, {Component} from "react"
import { Button as MuiButton } from "@mui/material"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import Router from "lib/Router/Router"
import { IconUtils } from "lib/utils/IconUtils"
import { MB } from "lib/MessageBroker/MB"
import withStyles from "@mui/styles/withStyles"

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

    onClickHandler() {
        if (this.props.publishToTopic) {
            MB.publish(this.props.publishToTopic, this.props.action)
        }
        if (this.props.route) {
            if (this.props.route.toLowerCase() === "back") {
                Router.goBackToPreviousPage()
            } else {
                Router.goToPage(this.props.route)
            }      
        }
    }

    render() {
        const {theme, classes, startIcon, title, endIcon, route, publishToTopic, action, ...other} = this.props
        const startIconAttr = {startIcon: IconUtils.resolveIcon(startIcon)}
        const endIconAttr = {endIcon: IconUtils.resolveIcon(endIcon)}
        
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

    static defaultStyles(theme: Theme): any {
        return  {
            root: { ...theme.components?.CancelButton?.styleOverrides?.root }
        }
    }
}

export default withStyles(CancelButton.defaultStyles, { withTheme: true})(CancelButton)