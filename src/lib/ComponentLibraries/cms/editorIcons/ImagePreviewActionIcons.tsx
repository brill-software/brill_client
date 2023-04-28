// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {Component} from "react"
import { withTheme } from '@material-ui/core'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"

interface Props {
    id: string
    theme: Theme
    publishToTopic: string
    [propName: string]: any
}

interface State {
}

class ImagePreviewActionsIcons extends Component<Props, State> {

    render() {
        const {id, theme, fileName, publishToTopic, ...other} = this.props
        return (
            <div style={{display: "flex",flexDirection: "row"}} {...other}>
                
            </div>
        )
    }
}

export default withTheme(ImagePreviewActionsIcons)