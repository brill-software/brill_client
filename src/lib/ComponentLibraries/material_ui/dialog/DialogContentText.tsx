// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { DialogContentText as MuiDialogContentText } from "@mui/material"
import { Html } from "lib/utils/HtmlUtils"

/**
 * Dialog Title component - a child component of a Dialog component. 
 * 
 */

interface Props {
    text: string // Can include HTML tags.
    [propName: string]: any
}

interface State {
}

export default class DialogContentText extends Component<Props, State> {

    render() {
        const {theme, text, ...other} = this.props
   
        return <MuiDialogContentText {...other} >
                    <span dangerouslySetInnerHTML={{__html: Html.sanitize(text)}} />
                </MuiDialogContentText>
    }
}