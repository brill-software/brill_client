// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Button as MuiButton, withTheme} from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB } from "lib/MessageBroker/MB"

/**
 * Publish Button component.
 */

interface Props {
    id: string
    theme: Theme
    title: string
    publishToTopic: string
    [propName: string]: any
}

interface State {
}

class PublishButton extends Component<Props, State> {

    onClickHandler() {
        MB.publish(this.props.publishToTopic, this.props.title)
    }

    render() {
        const {id, theme, title, publishToTopic, ...other} = this.props
        return (
            <MuiButton {...other}
                onClick={() => this.onClickHandler()}
            >{title}</MuiButton>
        )
    }
}

export default withTheme(PublishButton)