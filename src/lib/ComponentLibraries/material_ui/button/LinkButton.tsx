// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, {Component} from "react"
import { Button as MuiButton } from "@mui/material"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import Router from "lib/Router/Router"
import { IconUtils } from "lib/utils/IconUtils"
import withStyles from "@mui/styles/withStyles"

/**
 * Link Button component.
 * 
 */

interface Props {
    theme: Theme
    classes: any
    startIcon?: string
    title: string
    endIcon?: string
    route: string
    [propName: string]: any
}

interface State {
}

class LinkButton extends Component<Props, State> {

    static defaultStyles(theme: Theme): any {
        return  { root: { ...theme.components?.LinkButton?.styleOverrides?.root }}
    }

    onClickHandler() {
        if (this.props.route.toLowerCase() === "back") {
                Router.goBackToPreviousPage()
        } else {
                Router.goToPage(this.props.route)
        }   
    }

    render() {
        const {theme, classes, startIcon, title, endIcon, ...other} = this.props
        const startIconAttr = {startIcon: IconUtils.resolveIcon(startIcon)}
        const endIconAttr = {endIcon: IconUtils.resolveIcon(endIcon)}

        return (
            <MuiButton 
                className={classes.root}
                {...startIconAttr}
                {...endIconAttr}
                onClick={() => this.onClickHandler()}
                {...other}
            >{title}</MuiButton>
        )
    }
}

export default withStyles(LinkButton.defaultStyles, { withTheme: true})(LinkButton)