// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, {Component} from "react"
import { Paper as MuiPaper } from "@mui/material"

/**
 * Paper compnent - based on the MUI Paper component.
 * 
 */

interface Props {
    id: string
    children: any
    [propName: string]: any
}

interface State {
}

 export default class Paper extends Component<Props, State> {

    render() {
        const {id, theme, children, ...other} = this.props
        return (
            <MuiPaper {...other}>
                {children}
            </MuiPaper>

        )
    }
}