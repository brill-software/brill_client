// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Grid as MuiGrid, withTheme } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"

/**
 * Grid compnent - based on the MUI Grid component.
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

 class Grid extends Component<Props, State> {

    render() {
        const {id, theme, children, ...other} = this.props
        return (
            <MuiGrid {...other}>
                {children}
            </MuiGrid>
        )
    }
}

export default withTheme(Grid)