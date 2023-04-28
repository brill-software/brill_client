// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import { DialogActions as MuiDialogActions, withTheme } from "@material-ui/core"
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"

/**
 * Dialog Action component - a child component of a Dialog component.
 * 
 */

interface Props {
    theme: Theme
    children: any
    [propName: string]: any
}

interface State {
}

class DialogActions extends Component<Props, State> {

    render() {
        const {theme, children, ...other} = this.props 
        return <MuiDialogActions {...other}>{children}</MuiDialogActions>
    }
}

export default withTheme(DialogActions)