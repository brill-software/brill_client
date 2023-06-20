// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {Component} from "react"
import { withStyles } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import ToolTip from "@material-ui/core/Tooltip"
import { MB } from "lib/MessageBroker/MB"
import GridOffTwoTone from "@material-ui/icons/GridOffTwoTone"
import GridOnTwoTone from "@material-ui/icons/GridOnTwoTone"

/**
 * Brill CMS Page Editor Hide/Show ids and outline boxes icon.
 *
 */

 const defaultStyles: any = (theme: Theme) => {
    return  {
        root: {
            color: "#498ada",
            marginLeft: "20px",
            cursor: "pointer",
            ...theme.overrides?.IdsOnOffIcon?.root
        }
    }
}

interface Props {
    theme: Theme
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
        const {theme, classes, publishToTopic, onAction, offAction, ...other} = this.props
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
}

export default withStyles(defaultStyles, { name: "IdsOnOffIcon", withTheme: true})(IdsOnOffIcon)