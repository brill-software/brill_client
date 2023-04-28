// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Paper as MuiPaper, withTheme } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"

/**
 * Paper compnent - based on the MUI Paper component.
 * 
 */

interface Props {
    id: string
    theme: Theme
    children: any
    [propName: string]: any
}

interface State {
}

 class Paper extends Component<Props, State> {

    render() {
        const {id, theme, children, ...other} = this.props
        return (
            <MuiPaper {...other}>
                {children}
            </MuiPaper>

        )
    }
}

export default withTheme(Paper)