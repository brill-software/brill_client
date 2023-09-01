// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {Component} from "react"
import IconButton from "lib/ComponentLibraries/material_ui/button/IconButton"
import { IdGen } from "lib/utils/IdGen"
import StylesDropdown from "../StylesDropdown"
import ImageIcon from "./ImageIcon"

interface Props {
    subscribeToTopic: string  // Current style
    publishToTopic: string    // Command for the editor
    [propName: string]: any
}

interface State {
}

export default class XhtmlEditorActionsIcons extends Component<Props, State> {

    render() {
        const {subscribeToTopic, publishToTopic, ...other} = this.props
        return (
            <div style={{display: "flex",flexDirection: "row"}} {...other}>
                <IconButton key={IdGen.next()} iconName="Undo" tooltip="Undo - Cmd Z ***" 
                    publishToTopic={publishToTopic} action={{command: "undo"}}/>
                <IconButton key={IdGen.next()} iconName="Redo" tooltip="Redo - Shift Cmd Z" 
                    publishToTopic={publishToTopic} action={{command: "redo"}} />
                <IconButton iconName="Restore" tooltip="Revert to last saved changes" 
                   publishToTopic={publishToTopic} action={{command: "revert"}} />
                <IconButton key={IdGen.next()} iconName="SaveTwoTone" tooltip="Save - Cmd S" 
                    publishToTopic={publishToTopic} action={{command: "save"}} />
                <StylesDropdown key={IdGen.next()} subscribeToTopic={subscribeToTopic} publishToTopic={publishToTopic}/>
                <IconButton key={IdGen.next()} iconName="FormatBold" tooltip="Bold - Cmd B" 
                    publishToTopic={publishToTopic} action={{command: "BOLD"}} />
                <IconButton key={IdGen.next()} iconName="FormatItalic" tooltip="Italic - Cmd I" 
                    publishToTopic={publishToTopic} action={{command: "ITALIC"}} />
                <IconButton key={IdGen.next()} iconName="FormatUnderlined" tooltip="Underline - Cmd U" 
                    publishToTopic={publishToTopic} action={{command: "UNDERLINE"}} />
                <IconButton key={IdGen.next()} iconName="StrikethroughS" tooltip="Striketrough" 
                    publishToTopic={publishToTopic} action={{command: "STRIKETHROUGH"}} />
                <IconButton key={IdGen.next()} iconName="Code" tooltip="Code" 
                    publishToTopic={publishToTopic} action={{command: "CODE"}} />
                <IconButton key={IdGen.next()} iconName="FormatListBulleted" tooltip="Unordered List" 
                    publishToTopic={publishToTopic} action={{command: "unordered-list-item"}} />
                <IconButton key={IdGen.next()} iconName="FormatListNumbered" tooltip="Ordered List" 
                    publishToTopic={publishToTopic} action={{command: "ordered-list-item"}} />
                <ImageIcon key={IdGen.next()}
                    publishToTopic={publishToTopic} />
                <IconButton key={IdGen.next()} iconName="Handyman" tooltip="Display/Hide extra toolbar" 
                    publishToTopic={publishToTopic} action={{command: "flipToolbar"}} />
            </div>
        )
    }
}