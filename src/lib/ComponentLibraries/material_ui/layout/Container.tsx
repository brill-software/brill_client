// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Container as MuiContainer } from "@mui/material"

/**
 * Container compnent - based on the MUI Container component.
 * 
 */

interface Props {
    id: string 
    children: any
    [propName: string]: any
}

interface State {
}

export default class Container extends Component<Props, State> {

    render() {
        const {id, children, ...other} = this.props
        return (
            <MuiContainer {...other}>
                {children}
            </MuiContainer>
        )
    }
}