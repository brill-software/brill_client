// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import { DialogContentText as MuiDialogContentText, withTheme } from "@material-ui/core"
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { Html } from "lib/utils/HtmlUtils"

/**
 * Dialog Title component - a child component of a Dialog component. 
 * 
 */

interface Props {
    theme: Theme
    text: string // Can include HTML tags.
    [propName: string]: any
}

interface State {
}

class DialogContentText extends Component<Props, State> {

    render() {
        const {theme, text, ...other} = this.props
   
        return <MuiDialogContentText {...other} >
                    <span dangerouslySetInnerHTML={{__html: Html.sanitize(text)}} />
                </MuiDialogContentText>
    }
}

export default withTheme(DialogContentText)