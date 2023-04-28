// © 2022 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { withStyles } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"

/**
 * HTML A (anchor) component for external links.
 */

interface Props {
    theme: Theme
    classes: any
    children: any
    href: string
    target: string
    [propName: string]: any
}

interface State {
}

class A extends Component<Props, State> {

    static defaultStyles(theme: Theme): any {
        return  { root: { ...theme.overrides?.A?.root }}
    }

    render() {
        const {theme, classes, children, href, target, ...other} = this.props

        return (
            <a className={classes.root} href={href} target={target} {...other}>{children}</a>
        )
    }
}

export default withStyles(A.defaultStyles, {withTheme: true})(A)