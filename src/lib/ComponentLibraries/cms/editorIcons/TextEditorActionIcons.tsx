// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {Component} from "react"
import { withTheme } from '@material-ui/core'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import IconButton from "lib/ComponentLibraries/material_ui/button/IconButton"

interface Props {
    id: string
    theme: Theme
    fileName: string
    publishToTopic: string
    [propName: string]: any
}

interface State {
}

class TextEditorActionsIcons extends Component<Props, State> {

    render() {
        const {id, theme, fileName, publishToTopic, ...other} = this.props
        return (
            <div style={{display: "flex",flexDirection: "row"}} {...other}>
                <IconButton iconName="Undo" tooltip="Undo - Cmd Z" 
                   publishToTopic={publishToTopic} action="undo" />
                <IconButton iconName="Redo" tooltip="Redo - Shift Cmd Z" 
                    publishToTopic={publishToTopic} action="redo" />
                <IconButton iconName="Restore" tooltip="Revert to last saved changes" 
                   publishToTopic={publishToTopic} action="revert" />
                <IconButton iconName="SaveTwoTone" tooltip="Save - Cmd S" 
                    publishToTopic={publishToTopic} action="save" />
                <IconButton iconName="Search" tooltip="Find - Cmd F" 
                    publishToTopic={publishToTopic} action="actions.find" />
                <IconButton iconName="FindReplace" tooltip="Find Replace" 
                    publishToTopic={publishToTopic} action="editor.action.startFindReplaceAction" />
                {!fileName.endsWith(".xhtml") &&
                    <IconButton iconName="FormatPaintTwoTone" tooltip="Format - Shift Alt F" 
                        publishToTopic={publishToTopic} action="editor.action.format" />
                }
            </div>
        )
    }
}

export default withTheme(TextEditorActionsIcons)