// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, { Component } from "react"
import { Dialog } from '@mui/material'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { IdGen } from "lib/utils/IdGen"
import ToolTip from "@mui/material/Tooltip"
import InsertPhotoTwoTone from "@mui/icons-material/InsertPhotoTwoTone"
import { MB } from "lib/MessageBroker/MB"
import { Button, DialogActions, DialogContent, DialogContentText, IconButton, TextField, Typography } from '@mui/material'
import CloseIcon from "@mui/icons-material/Close"
import withStyles from "@mui/styles/withStyles"

interface Props {
    publishToTopic: string
    [propName: string]: any
}

interface State {
    open: boolean
}

class ImageIcon extends Component<Props, State> {
    imageTopic: string = ""
    width: string = ""
    height: string = ""

    constructor(props: Props) {
        super(props)
        this.state = {open: false}
    }

    onIconClickHandler(evnt: any) {
        this.setState({open: true})
    }

    onCloseHandler(event: any) {
        this.setState({open: false})
    }

    onKeyDown(event: React.KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault()
            event.stopPropagation()
            this.onInsertButtonClickHandler(event)
        }
    }

    onFieldChange(event: any) {
        this.imageTopic = event.target.value
    }

    onWidthFieldChange(event: any) {
        this.width = event.target.value
    }

    onHeightFieldChange(event: any) {
        this.height = event.target.value
    }

    onInsertButtonClickHandler(evnt: any) {
        MB.publish(this.props.publishToTopic, {command: "insertImage", url: this.imageTopic, 
            width: this.width, height: this.height})
        this.setState({open: false})
    }

    render() {
        const {classes, publishToTopic, ...other} = this.props

        return (
            <div {...other}>
                <div key={IdGen.next()} className={classes.root}>
                    <ToolTip title="Insert Image">
                        <div {...other}
                            onClick={event => this.onIconClickHandler(event)}>
                            <InsertPhotoTwoTone />
                        </div>
                    </ToolTip>
                </div>
                <Dialog className={classes.root} onClose={event => this.onCloseHandler(event)} open={this.state.open} {...other}>
                <Typography variant="h3" style={{padding: "24px"}}>Insert Image</Typography>
                <IconButton className={classes.closeButton} onClick={event => this.onCloseHandler(event)}>
                    <CloseIcon />
                </IconButton>
                <DialogContent dividers>
                    <DialogContentText>Please enter the image Topic e.g. image:/myapp/Images/image.png</DialogContentText>
                    <TextField style={{paddingBottom: "10px"}} onChange={event => this.onFieldChange(event)} autoFocus 
                        margin="dense" label="Image Topic" type="text" fullWidth
                        onKeyDown={event => this.onKeyDown(event)} />
                    <TextField style={{paddingBottom: "10px"}} onChange={event => this.onWidthFieldChange(event)}
                        margin="dense" label="Width [optional]" type="text" fullWidth
                        onKeyDown={event => this.onKeyDown(event)} />
                    <TextField style={{paddingBottom: "10px"}} onChange={event => this.onHeightFieldChange(event)} 
                        margin="dense" label="Height [optional]" type="text" fullWidth
                        onKeyDown={event => this.onKeyDown(event)} />    
                </DialogContent>
                <DialogActions style={{padding: "10px"}}> 
                    <Button variant="contained" onClick={event => this.onInsertButtonClickHandler(event)} color="primary">
                        Insert
                    </Button>
                </DialogActions>
            </Dialog>
            </div>
        )
    }

    static defaultStyles(theme: Theme): any {
        return  {
            root: {
                 color: "#498ada",
                 cursor: "pointer",
                 marginLeft: "20px",
                 ...theme.overrides?.ImageIcon?.root
             },
             dialogRoot: {
                 margin: 0,
                 padding: theme.spacing(2),
                 ...theme.overrides?.ImageIcon?.root
             },
             closeButton: {
                 position: 'absolute',
                 right: theme.spacing(1),
                 top: theme.spacing(1),
                 color: theme.palette.grey[600],
                 ...theme.overrides?.ImageIcon?.closeButton
             }  
        }
    }
}

export default withStyles(ImageIcon.defaultStyles)(ImageIcon)