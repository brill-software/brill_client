// © 2022 Brill Software Limited - Brill CMS, distributed under the MIT License.
import React, {Component} from "react"

interface Props {
    publishToTopic: string
    [propName: string]: any
}

interface State {
}

export default class MarkdownViewerActionsIcons extends Component<Props, State> {

    render() {
        const {publishToTopic, ...other} = this.props
        return (
            <div style={{display: "flex",flexDirection: "row"}} {...other}>
                
            </div>
        )
    }
}