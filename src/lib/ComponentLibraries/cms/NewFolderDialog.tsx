// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, { Component } from "react"
import { Button, DialogActions, DialogContent, DialogContentText, IconButton, TextField, Typography, withStyles } from '@material-ui/core'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { Dialog } from "@material-ui/core"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import CloseIcon from "@material-ui/icons/Close"
import { TopicUtils } from "lib/utils/TopicUtils"

/**
 * Displays the New Folder dialog. Based on the SingleFieldDialog.
 * 
 * 
 */

const defaultStyles: any = (theme: Theme) => {
     return  {
        root: {
            margin: 0,
            padding: theme.spacing(2),
            ...theme.overrides?.SingleFieldDialog?.root
        },
        closeButton: {
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: theme.palette.grey[600],
            ...theme.overrides?.SingleFieldDialog?.closeButton
        }
    }
}

interface Props {
    id: string
    theme: Theme
    title: string
    prompt: string
    fieldLabel: string
    buttonLabel: string
    subscribeToTopic: string
    publishToTopic: string
    [propName: string]: any
}

interface State {
    open: boolean
}

class NewFolderDialog extends Component<Props, State> {
    unsubscribeToken: Token
    fileTopic: string
    folder: string = ""
    fieldValue: string = ""

    constructor(props: Props) {
        super(props)
        this.state = {open: false}
    }

    componentDidMount() {
        this.unsubscribeToken = MB.subscribe(this.props.subscribeToTopic, 
            (topic, data) =>  this.dataLoadedCallback(topic, data), 
            (topic, error) => this.errorCallback(topic, error))
    }   

    componentWillUnmount() {
        MB.unsubscribe(this.unsubscribeToken, true)
    }

    dataLoadedCallback(topic: string, data: string) {
        this.fileTopic = data
        this.folder = TopicUtils.getFolder(this.fileTopic)
        this.fieldValue = ""
        this.setState({open: true})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    onFieldChange(event: any) {
        this.fieldValue = event.target.value
    }

    onCloseHandler(event: any) {
        this.setState({open: false})
    }

    onKeyDown(event: React.KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault()
            event.stopPropagation()
            this.onButtonClickHandler(event)
        }
    }

    onButtonClickHandler(event: any) {
        const publishTo = this.props.publishToTopic.replace("{path}", this.folder + (this.folder.length > 0 ? "/" : "") + this.fieldValue)
        MB.publish(publishTo, null)
        this.setState({open: false})
    }

    render() {
        const {id, theme, classes, title, prompt, fieldLabel, buttonLabel, subscribeToTopic,publishToTopic, ...other} = this.props
        return (
            <Dialog className={classes.root} onClose={event => this.onCloseHandler(event)} open={this.state.open} {...other}>
                <Typography variant="h3" style={{padding: "24px"}}>{title}</Typography>
                <IconButton className={classes.closeButton} onClick={event => this.onCloseHandler(event)}>
                    <CloseIcon />
                </IconButton>
                <DialogContent dividers>
                <DialogContentText>The new file will be created under the folder:</DialogContentText>
                <DialogContentText><b>{this.folder}</b></DialogContentText>
                    <DialogContentText>{prompt}</DialogContentText>
                    <TextField style={{paddingBottom: "10px"}} onChange={event => this.onFieldChange(event)} autoFocus 
                        margin="dense" label={fieldLabel} type="text" fullWidth
                        onKeyDown={event => this.onKeyDown(event)} 
                        defaultValue={this.fieldValue} /> 
                </DialogContent>
                <DialogActions style={{padding: "10px"}}> 
                    <Button variant="contained" onClick={event => this.onButtonClickHandler(event)} color="primary">
                        {buttonLabel}
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }
}

export default withStyles(defaultStyles, { name: "NewFolderDialog", withTheme: true})(NewFolderDialog)