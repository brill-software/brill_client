// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, { Component } from "react"
import { Button, DialogActions, DialogContent, DialogContentText, IconButton, Typography } from '@mui/material'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { Dialog } from "@mui/material"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import CloseIcon from "@mui/icons-material/Close"
import withStyles from "@mui/styles/withStyles"

/**
 * Displays a modal dialog that alerts the users to an issue.
 * 
 * The dialog window is opened when a string or boolean is published to the subscribeToTopic. If
 * its a string, the string is used as the prompt.
 * 
 * Should the user click on OK or press the enter key, the string "OK" is published to the
 * publishToTopic.
 * 
 */

const defaultStyles: any = (theme: Theme) => {
     return  {
        root: {
            margin: 0,
            padding: theme.spacing(2),
            ...theme.components?.ConfirmDialog?.styleOverrides?.root
        },
        closeButton: {
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: theme.palette.grey[600],
            ...theme.components?.ConfirmDialog?.styleOverrides?.closeButton
        }
    }
}

interface Props {
    id: string
    theme: Theme
    title: string
    prompt: string
    subscribeToTopic: string
    publishToTopic: string
    [propName: string]: any
}

interface State {
    open: boolean
    prompt: string
}

class AlertDialog extends Component<Props, State> {
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {open: false, prompt: props.prompt}
    }

    componentDidMount() {
        this.token = MB.subscribe(this.props.subscribeToTopic, 
            (topic, data) => this.dataLoadedCallback(topic, data), (topic, error) => this.errorCallback(topic, error))
    }   

    componentWillUnmount() {
        MB.unsubscribe(this.token, true)
    }

    dataLoadedCallback(topic: string, data: any) {
        if (typeof data === "string") {
            this.setState({open: true,prompt: data})
        } else {
            this.setState({open: true})
        }
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    onCloseHandler(event: any) {
        this.setState({open: false})
    }

    onKeyDown(event: React.KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault()
            event.stopPropagation()
            this.onOkButtonClickHandler(event)
        }
    }

    onOkButtonClickHandler(event: any) {
        MB.publish(this.props.publishToTopic, "OK")
        this.setState({open: false})
    }

    render() {
        const {id, theme, classes, title, prompt, subscribeToTopic, publishToTopic, ...other} = this.props
        return (
            <Dialog className={classes.root} onClose={event => this.onCloseHandler(event)} open={this.state.open} 
                onKeyDown={event => this.onKeyDown(event)}
                {...other}>
                <Typography variant="h3" style={{padding: "24px"}}>{title}</Typography>
                <IconButton className={classes.closeButton} onClick={(event) => this.onCloseHandler(event)}>
                    <CloseIcon />
                </IconButton>
                <DialogContent dividers>
                    <DialogContentText>{this.state.prompt}</DialogContentText>
                </DialogContent>
                <DialogActions style={{padding: "10px"}}> 
                    <Button variant="contained" onClick={(event) => this.onOkButtonClickHandler(event)} color="primary">OK</Button>
                </DialogActions>
            </Dialog>
        )
    }
}
export default withStyles(defaultStyles, { name: "AlertDialog"})(AlertDialog)