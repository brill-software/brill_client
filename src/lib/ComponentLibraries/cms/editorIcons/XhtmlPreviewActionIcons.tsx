// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {Component} from "react"
import { withTheme } from '@material-ui/core'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import IconButton from "lib/ComponentLibraries/material_ui/button/IconButton"

interface Props {
    id: string
    theme: Theme
    publishToTopic: string
    [propName: string]: any
}

interface State {
}

class XhtmlPreviewActionsIcons extends Component<Props, State> {

    render() {
        const {id, theme, fileName, publishToTopic, ...other} = this.props
        return (
            <div style={{display: "flex",flexDirection: "row"}} {...other}>
                <IconButton iconName="Restore" tooltip="Revert to last saved changes" 
                   publishToTopic={publishToTopic} action="revert" />
                <IconButton iconName="SaveTwoTone" tooltip="Save" 
                    publishToTopic={publishToTopic} action="save" />
            </div>
        )
    }
}

export default withTheme(XhtmlPreviewActionsIcons)