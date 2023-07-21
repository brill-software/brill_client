// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { DialogContent as MuiDialogContent } from "@mui/material"

/**
 * Dialog Content component - a child component of a Dialog component.
 * 
 */

interface Props {
    dividers?: boolean
    children: any
    [propName: string]: any
}

interface State {
}

export default class DialogContent extends Component<Props, State> {

    render() {
        const {dividers, theme, children, ...other} = this.props 
        return <MuiDialogContent dividers={dividers} {...other}>{children}</MuiDialogContent>
    }
}