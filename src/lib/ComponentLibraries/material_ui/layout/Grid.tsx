// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, {Component} from "react"
import { Grid as MuiGrid } from "@mui/material"

/**
 * Grid compnent - based on the MUI Grid component.
 * 
 */

interface Props {
    id: string
    children: any
    [propName: string]: any
}

interface State {
}

export default class Grid extends Component<Props, State> {

    render() {
        const {id, children, ...other} = this.props
        return (
            <MuiGrid {...other}>
                {children}
            </MuiGrid>
        )
    }
}