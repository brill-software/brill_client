// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {Component} from "react"
import { withTheme } from '@material-ui/core'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import IconButton from "lib/ComponentLibraries/material_ui/button/IconButton"
import { IdGen } from "lib/utils/IdGen"
import StylesDropdown from "../StylesDropdown"
import ImageIcon from "./ImageIcon"

interface Props {
    id: string
    theme: Theme
    fileName: string
    subscribeToTopic: string  // Current style
    publishToTopic: string    // Command for the editor
    [propName: string]: any
}

interface State {
}

class XhtmlEditorActionsIcons extends Component<Props, State> {

    render() {
        const {id, theme, subscribeToTopic, publishToTopic, ...other} = this.props
        return (
            <div style={{display: "flex",flexDirection: "row"}} {...other}>
                <IconButton key={IdGen.next()} iconName="UndoTwoTone" tooltip="Undo - Cmd Z ***" 
                    publishToTopic={publishToTopic} action={{command: "undo"}}/>
                <IconButton key={IdGen.next()} iconName="RedoTwoTone" tooltip="Redo - Shift Cmd Z" 
                    publishToTopic={publishToTopic} action={{command: "redo"}} />
                <IconButton iconName="RestoreTwoTone" tooltip="Revert to last saved changes" 
                   publishToTopic={publishToTopic} action={{command: "revert"}} />
                <IconButton key={IdGen.next()} iconName="SaveTwoTone" tooltip="Save - Cmd S" 
                    publishToTopic={publishToTopic} action={{command: "save"}} />
                <StylesDropdown key={IdGen.next()} subscribeToTopic={subscribeToTopic} publishToTopic={publishToTopic}/>
                <IconButton key={IdGen.next()} iconName="FormatBoldTwoTone" tooltip="Bold - Cmd B" 
                    publishToTopic={publishToTopic} action={{command: "BOLD"}} />
                <IconButton key={IdGen.next()} iconName="FormatItalicTwoTone" tooltip="Italic - Cmd I" 
                    publishToTopic={publishToTopic} action={{command: "ITALIC"}} />
                <IconButton key={IdGen.next()} iconName="FormatUnderlinedTwoTone" tooltip="Underline - Cmd U" 
                    publishToTopic={publishToTopic} action={{command: "UNDERLINE"}} />
                <IconButton key={IdGen.next()} iconName="StrikethroughSTwoTone" tooltip="Striketrough" 
                    publishToTopic={publishToTopic} action={{command: "STRIKETHROUGH"}} />
                <IconButton key={IdGen.next()} iconName="CodeTwoTone" tooltip="Code" 
                    publishToTopic={publishToTopic} action={{command: "CODE"}} />
                <IconButton key={IdGen.next()} iconName="FormatListBulletedTwoTone" tooltip="Unordered List" 
                    publishToTopic={publishToTopic} action={{command: "unordered-list-item"}} />
                <IconButton key={IdGen.next()} iconName="FormatListNumberedTwoTone" tooltip="Ordered List" 
                    publishToTopic={publishToTopic} action={{command: "ordered-list-item"}} />
                <ImageIcon key={IdGen.next()}
                    publishToTopic={publishToTopic} />
            </div>
        )
    }
}

export default withTheme(XhtmlEditorActionsIcons)