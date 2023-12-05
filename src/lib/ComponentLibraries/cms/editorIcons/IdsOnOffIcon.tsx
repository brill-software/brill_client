// © 2022 Brill Software Limited - Brill CMS, distributed under the MIT License.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import ToolTip from "@mui/material/Tooltip"
import { MB } from "lib/MessageBroker/MB"
import GridOffTwoTone from "@mui/icons-material/GridOffTwoTone"
import GridOnTwoTone from "@mui/icons-material/GridOnTwoTone"
import withStyles from "@mui/styles/withStyles"

/**
 * Brill CMS Page Editor Hide/Show ids and outline boxes icon.
 *
 */

interface Props {
    classes: any
    publishToTopic: string
    onAction: string
    offAction: string
    [propName: string]: any
}

interface State {
    on: boolean
}

class IdsOnOffIcon extends Component<Props, State> {

    constructor(props: Props) {
        super(props)
        this.state = {on: true}
    }

    onClickHandler(event: any, action: string) {
        MB.publish(this.props.publishToTopic, action)
        if (this.state.on) {
            MB.publish("statusBar.message", "ids hidden...")
        } else {
            MB.publish("statusBar.message", "ids shown...")
        }
        this.setState({on: !this.state.on})
    }

    render() {
        const {classes, publishToTopic, onAction, offAction, ...other} = this.props
        const {on} = this.state
        const tooltip = on ? "Hide component boxes - Cmd B" : "Show component boxes - Cmd B"
        const icon = on ? <GridOffTwoTone /> : <GridOnTwoTone />
        const action = on ? offAction : onAction

        return (
            <div className={classes.root} {...other}>
                <ToolTip title={tooltip}>
                    <div onClick={(event) => this.onClickHandler(event, action)}>{icon}</div>
                </ToolTip>
            </div>
        )
    }

    static defaultStyles(theme: Theme): any {
        return  {
            root: {
                color: "#498ada",
                marginLeft: "20px",
                cursor: "pointer",
                ...theme.components?.IdsOnOffIcon?.styleOverrides?.root
            }
        }
    }
}

export default withStyles(IdsOnOffIcon.defaultStyles)(IdsOnOffIcon)