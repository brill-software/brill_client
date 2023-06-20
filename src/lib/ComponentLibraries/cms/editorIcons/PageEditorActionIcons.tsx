// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {Component} from "react"
import { withTheme } from '@material-ui/core'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import IconButton from "lib/ComponentLibraries/material_ui/button/IconButton"
import { IdGen } from "lib/utils/IdGen"
import IdsOnOffIcon from "./IdsOnOffIcon"

interface Props {
    theme: Theme
    fileName: string
    publishToTopic: string
    [propName: string]: any
}

interface State {
}

class PageEditorActionsIcons extends Component<Props, State> {

    render() {
        const {theme, fileName, publishToTopic, ...other} = this.props
        return (
            <div style={{display: "flex",flexDirection: "row"}} {...other}>               
                <IconButton iconName="Undo" tooltip="Undo - Cmd Z" 
                   publishToTopic={publishToTopic} action="undo" />
                <IconButton iconName="Redo" tooltip="Redo - Shift Cmd Z" 
                    publishToTopic={publishToTopic} action="redo" />
                <IdsOnOffIcon key={IdGen.next()}
                    publishToTopic={publishToTopic} onAction="showIds" offAction="hideIds"/>
                <IconButton iconName="Restore" tooltip="Revert to last saved changes" 
                   publishToTopic={publishToTopic} action="revert" />
                <IconButton iconName="SaveTwoTone" tooltip="Save - Cmd S" 
                    publishToTopic={publishToTopic} action="save" />
            </div>
        )
    }
}

export default withTheme(PageEditorActionsIcons)