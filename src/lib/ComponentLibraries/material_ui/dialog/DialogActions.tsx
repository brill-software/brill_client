// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { DialogActions as MuiDialogActions } from "@mui/material"
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

export default class DialogActions extends Component<Props, State> {

    render() {
        const {theme, children, ...other} = this.props 
        return <MuiDialogActions {...other}>{children}</MuiDialogActions>
    }
}