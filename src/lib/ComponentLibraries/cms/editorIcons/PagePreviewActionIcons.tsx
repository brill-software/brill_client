// © 2022 Brill Software Limited - Brill CMS, distributed under the MIT License.
import React, {Component} from "react"
import IconButton from "lib/ComponentLibraries/material_ui/button/IconButton"

interface Props {
    publishToTopic: string
    [propName: string]: any
}

interface State {
}

export default class PagePreviewActionsIcons extends Component<Props, State> {

    render() {
        const {fileName, publishToTopic, ...other} = this.props
        return (
            <div style={{display: "flex",flexDirection: "row"}} {...other}>
                <IconButton iconName="Restore" tooltip="Revert to last saved changes" 
                   publishToTopic={publishToTopic} action="revert" />
                <IconButton iconName="SaveTwoTone" tooltip="Save" 
                    publishToTopic={publishToTopic} action="save" />
                <IconButton iconName="ListAltTwoTone" tooltip="Topics" 
                    publishToTopic={publishToTopic} action="topics" />
                <IconButton iconName="Launch" tooltip="View Page" 
                    publishToTopic={publishToTopic} action="view" />
            </div>
        )
    }
}