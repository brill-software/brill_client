// © 2022 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import withStyles from "@mui/styles/withStyles"

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

    render() {
        const {id, theme, classes, children, href, target, ...other} = this.props

        return (
            <a className={classes.root} href={href} target={target} {...other}>{children}</a>
        )
    }

    static defaultStyles(theme: Theme): any {
        return  { root: { ...theme.overrides?.A?.root }}
    }

}

export default withStyles(A.defaultStyles, {withTheme: true})(A)