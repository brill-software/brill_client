// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, {Component} from "react"
import { Button as MuiButton } from "@mui/material"
import { MB } from "lib/MessageBroker/MB"

/**
 * Publish Button component.
 */

interface Props {
    id: string
    title: string
    publishToTopic: string
    [propName: string]: any
}

interface State {
}

export default class PublishButton extends Component<Props, State> {

    onClickHandler() {
        MB.publish(this.props.publishToTopic, this.props.title)
    }

    render() {
        const {id, title, publishToTopic, ...other} = this.props
        return (
            <MuiButton {...other}
                onClick={() => this.onClickHandler()}
            >{title}</MuiButton>
        )
    }
}