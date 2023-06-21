// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Button as MuiButton } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import Router from "lib/Router/Router"
import { withStyles } from "@material-ui/core"
import { IconUtils } from "lib/utils/IconUtils"

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
        return  { root: { ...theme.overrides?.LinkButton?.root }}
    }

    onClickHandler() {
        Router.goToPage(this.props.route)
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