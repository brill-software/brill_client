// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Container as MuiContainer, withTheme} from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"

/**
 * Container compnent - based on the MUI Container component.
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

class Container extends Component<Props, State> {

    render() {
        const {id, theme, children, ...other} = this.props
        return (
            <MuiContainer {...other}>
                {children}
            </MuiContainer>
        )
    }
}

export default withTheme(Container)