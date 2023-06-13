// © 2023 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, { Component } from "react"
import { Button, DialogActions, DialogContent, IconButton as MuiIconButton, Popover, Typography, withStyles } from '@material-ui/core'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import CloseIcon from "@material-ui/icons/Close"
import Draggable from "react-draggable"
import MUIDataTable from "mui-datatables"

/**
 * Displays a table of topics and topic values. Used by Page Preview.
 *
 */

const defaultStyles: any = (theme: Theme) => {
    return {
        root: {
            margin: 0,
            padding: theme.spacing(2),
            pointerEvents: "none",  // Make Popover non-modal.
            ...theme.overrides?.TopicsPopover?.root
        },
        closeButton: {
            position: 'absolute',
            right: theme.spacing(1),
            top: "0px",
            color: theme.palette.grey[600],
            ...theme.overrides?.TopicsPopover?.closeButton
        }
    }
}

class TopicTableRow {
    topic: string
    value: string
}

interface Props {
    id: string
    theme: Theme
    subscribeToTopic: string
    [propName: string]: any
}

interface State {
    open: boolean
    data: TopicTableRow[]
}

class TopicsPopover extends Component<Props, State> {
    private static MINIMUM_WIDTH: number = 1120

    token: Token
    token2: Token

    constructor(props: Props) {
        super(props)
        this.state = { open: false, data: [] }
    }

    componentDidMount() {
        this.token = MB.subscribe(this.props.subscribeToTopic,
            (topic, data) => this.openPopupCallback(topic, data),
            (topic, error) => this.errorCallback(topic, error))
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token, true)
        MB.unsubscribe(this.token2, true)
    }

    openPopupCallback(topic: string, data: any) {
        this.setState({open: true})
        this.token2 = MB.subscribe(MB.ALL_TOPICS_TOPIC,
            (topic, data) => this.allTopicsCallback(topic, data),
            (topic, error) => this.errorCallback(topic, error))
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : " + error.title + " " + error.detail)
    }

    allTopicsCallback(topic: string, table: TopicTableRow[]) {
        if (this.state.open) {
            this.setState({data: table})
        }
    }

    onCloseHandler(event: React.MouseEvent) {
        event.stopPropagation()
        this.setState({ open: false })
        MB.unsubscribe(this.token2, true)

    }

    render() {
        if (!this.state.open) {
            return null
        }
        const { classes } = this.props

        const width = TopicsPopover.MINIMUM_WIDTH
       
        return (
            <Draggable handle=".handle">
                <Popover style={{ margin: "2px" }}
                    open={this.state.open}
                    anchorReference="anchorPosition"
                    anchorPosition={{left:10, top: 500}}
                    disableEnforceFocus={true}
                    PaperProps={{ style: { pointerEvents: "auto", opacity: "0.96", width } }}
                    className={classes.root}
                >
                    <Typography className="handle" variant="h3" style={{ padding: "12px", background: "#f0f0f0", cursor: "move" }}>Topics</Typography>
                    <MuiIconButton className={classes.closeButton} onClick={event => this.onCloseHandler(event)}><CloseIcon /></MuiIconButton>
                    <DialogContent dividers>
                       <MUIDataTable
                            title={<Typography variant="h6"></Typography>}
                            columns={[{name: "topic",label: "Topic"}, {name: "value", label: "Value"}]}
                            options={{selectableRows: "none"}}
                            data={this.state.data}
                        />
                    </DialogContent>
                    <DialogActions style={{ padding: "10px" }}>
                        <Button variant="outlined" onClick={event => this.onCloseHandler(event)} color="secondary">Close</Button>
                    </DialogActions>
                </Popover>
            </Draggable>
        )
    }
}

export default withStyles(defaultStyles, { name: "TopicsPopover", withTheme: true })(TopicsPopover)