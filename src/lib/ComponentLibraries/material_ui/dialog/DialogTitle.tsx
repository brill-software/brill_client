// © 2023 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, {Component} from "react"
import { DialogTitle as MuiDialogTitle } from "@mui/material"
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

export default class DialogTitle extends Component<Props, State> {
  
    render() {
        const {theme, text, ...other} = this.props
        return <MuiDialogTitle  {...other}>
                    <span dangerouslySetInnerHTML={{__html: Html.sanitize(text)}} />
               </MuiDialogTitle>
    }
}