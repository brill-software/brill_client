// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {Component} from "react"
import IconButton from "lib/ComponentLibraries/material_ui/button/IconButton"

interface Props {
    fileName: string
    publishToTopic: string
    [propName: string]: any
}

interface State {
}

export default class DiffEditorActionsIcons extends Component<Props, State> {

    render() {
        const {fileName, publishToTopic, ...other} = this.props
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
                <IconButton iconName="ArrowUpward" tooltip="Previous change - Shift F7" 
                    publishToTopic={publishToTopic} action="previous" />
                <IconButton iconName="ArrowDownward" tooltip="Next change - F7" 
                    publishToTopic={publishToTopic} action="next" />
            </div>
        )
    }
}