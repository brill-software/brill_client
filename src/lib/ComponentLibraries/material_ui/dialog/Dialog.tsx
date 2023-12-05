// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, { Component } from "react"
import { IconButton } from '@mui/material'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { Dialog as MuiDialog} from "@mui/material"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import CloseIcon from "@mui/icons-material/Close"
import withStyles from "@mui/styles/withStyles"

/**
 * Dialog component - based on the MUI Dialog component.
 *
 * The typical structure of a dialog is:
 * 
 *  Dialog
 *      DialogTitle
 *      DialogContent
 *          DialogContentText
 *          --- form components ---
 *      DialogActions
 *          --- Submit buttom ---
 * 
 */

interface Props {
    id: string
    theme: Theme
    classes: any
    title: string
    subscribeToTopic: string
    children: string
    [propName: string]: any
}

class Button {
    value: string
    label: string
}

interface State {
    open: boolean
    value: string
    button: Button[]
    error: boolean
    helperText: string
}

class Dialog extends Component<Props, State> {
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {open: false, value: "", button: [], error: false, helperText: ""}
    }

    componentDidMount() {
        this.token = MB.subscribe(this.props.subscribeToTopic,
            (topic, data) => this.dataLoadedCallback(topic, data), (topic, error) => this.errorCallback(topic, error))
    }   

    componentWillUnmount() {
        MB.unsubscribe(this.token, true)
    }

    dataLoadedCallback(topic: string, data: any) {
        this.setState({open: data !== undefined})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    onButtonChange(event: any) {
        this.setState(event.target.value)
    }

    onCloseHandler(event: any) {
        this.setState({open: false})
        MB.publish(this.props.subscribeToTopic, undefined)
    }

    render() {
        const {id, theme, classes, subscribeToTopic, ...other} = this.props
        return (
            <MuiDialog className={classes.root} onClose={(event) => this.onCloseHandler(event)} open={this.state.open} {...other}>
                <IconButton className={classes.closeButton} onClick={(event) => this.onCloseHandler(event)}>
                    <CloseIcon />
                </IconButton>
                    {this.props.children}
            </MuiDialog>
        )
    }

    static defaultStyles(theme: Theme): any {
        return  {
            root: {
                margin: 0,
                padding: theme.spacing(2),
                ...theme.components?.Dialog?.styleOverrides?.root
            },
            closeButton: {
                position: 'absolute',
                right: theme.spacing(1),
                top: theme.spacing(1),
                color: theme.palette.grey[600],
                ...theme.components?.Dialog?.styleOverrides?.closeButton
            }
        }
    }
}

export default withStyles(Dialog.defaultStyles, { withTheme: true})(Dialog)