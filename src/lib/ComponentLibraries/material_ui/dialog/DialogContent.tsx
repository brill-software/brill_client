// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import { DialogContent as MuiDialogContent, withTheme } from "@material-ui/core"
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"

/**
 * Dialog Content component - a child component of a Dialog component.
 * 
 */

interface Props {
    theme: Theme
    dividers?: boolean
    children: any
    [propName: string]: any
}

interface State {
}

class DialogContent extends Component<Props, State> {

    render() {
        const {dividers, theme, children, ...other} = this.props 
        return <MuiDialogContent dividers={dividers} {...other}>{children}</MuiDialogContent>
    }
}

export default withTheme(DialogContent)