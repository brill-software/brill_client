// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, { Component } from "react"
import { Button, DialogActions, DialogContent, DialogContentText, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, Typography, withStyles } from '@material-ui/core'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { Dialog } from "@material-ui/core"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import CloseIcon from "@material-ui/icons/Close"
import { TopicUtils } from "lib/utils/TopicUtils"
import { IdGen } from "lib/utils/IdGen"
import Alert from "@material-ui/lab/Alert"
import { ConversionUtils } from "lib/utils/ConversionUtils"
import { ReactUtils } from "lib/utils/ReactUtils"

/**
 * Displays a modal dialog for uploading files. Supports both drag and drop and selection of files.
 * When a file already exists on the server, a file version number will be added to the
 * file name. e.g. demo(1).txt 
 */

const defaultStyles: any = (theme: Theme) => {
     return  {
        root: {
            margin: 0,
            width: "1200px",
            padding: theme.spacing(2),
            ...theme.overrides?.UploadFileDialog?.root
        },
        dropZone: {
            border: "5px dashed lightgrey",
            borderRadius: "10px",
            padding: "10px",
            width: "350px",
            height: "260px",     
            ...theme.overrides?.UploadFileDialog?.dropZone
        },
        fileListBox: {
            border: "5px solid lightgrey",
            marginLeft: "20px",
            borderRadius: "10px",
            padding: "10px",
            width: "550px",
            height: "260px",
            overflowY: "scroll",
            ...theme.overrides?.UploadFileDialog?.dropZone
        },
        browseButton: {
            color: theme.palette.primary.main,
            textDecoration: "underline",
            textTransform: "capitalize",
            ...theme.overrides?.UploadFileDialog?.browseButton
        },
        prompt4: {
            fontSize: "1.0em", 
            marginTop: "10px",
            ...theme.overrides?.UploadFileDialog?.prompt4
        },
        submitButton: {
            marginLeft: "720px", 
            marginTop: "20px", 
            width: "200px",
            ...theme.overrides?.UploadFileDialog?.submitButton
        },
        closeButton: {
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: theme.palette.grey[600],
            ...theme.overrides?.UploadFileDialog?.closeButton
        }
    }
}

class FileEntry {
    file: File
    fileReader: FileReader
    contentBase64: string | undefined

    constructor(file: File, reader: FileReader) {
        this.file = file
        this.fileReader = reader
    }
}

interface Props {
    id: string
    theme: Theme
    title: string
    prompt1?: string // Default: "Files will be uploaded to the folder "
    prompt2?: string // Default: "Drag one or more files to this Drop Zone or "
    prompt3?: string // Default: "No files selected."
    prompt4?: string // Default: "Any files that already exist on the server won't be overwritten. A version number will be added to the file name."
    buttonLabel?: string // Default: Submit
    folder?: string // The folder to upload files to. Folder can also be supplied using the subscribeToTopic.
    subscribeToTopic: string // The topic content contains the folder to publish uploaded files to or if the folder property is supplied, true to open and false to close.
    noOverwrite: boolean // When set to true, prevents files been overwritten on the server. Instead a version number is added to the file name.
    [propName: string]: any
}

interface State {
    open: boolean
    numFilesSelected: number
    uploadCount: number
    selectedFileName: string
    errorMsg: string | undefined
}

class UploadFileDialog extends Component<Props, State> {
    token: Token
    folder: string
    fileMap: Map<string, FileEntry> = new Map<string, FileEntry>()
    uploadsInProgress: number = 0
   
    constructor(props: Props) {
        super(props)
        this.state = {open: false, numFilesSelected: 0, uploadCount: 0, selectedFileName: "", errorMsg: undefined}
    }

    componentDidMount() {
        this.token = MB.subscribe(this.props.subscribeToTopic, 
            (topic, data) => this.dataLoadedCallback(topic, data), (topic, error) => this.errorCallback(topic, error))
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token, true)
    }

    dataLoadedCallback(topic: string, data: string | boolean) {
        if (typeof data === "string") {
            this.folder = TopicUtils.getFolder(data)
            this.setState({open: true})
            return
        }
        if (typeof data === "boolean" && this.props.folder) {
            this.folder = this.props.folder
            this.setState({open: data})
            return
        }
        if (typeof data === "boolean" && data === false) {
            this.setState({open: false})
            return
        }
        console.error("UploadFilesDialog is missing the property 'folder' or data is undefined.")
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    onFilesSelected(event: any /* React.ChangeEvent<Element> */) {
        if (event.target && event.target.files && event.target.files.length > 0) {
            for (let i = 0; i < event.target.files.length; i++) {
                const file = event.target.files[i]
                const reader: FileReader = new FileReader()
                const fileEntry = new FileEntry(file, reader)
                this.fileMap.set(file.name, fileEntry)
                reader.onload = () => this.onFileLoad(fileEntry)
                reader.readAsArrayBuffer(file)
                this.uploadsInProgress++
            }
        }
        this.setState({numFilesSelected: this.fileMap.size})
        event.preventDefault()
    }

    onDrop(event: any /* React.ChangeEvent<Element> */) {
        if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            for (let i = 0; i < event.dataTransfer.files.length; i++) {
                const file = event.dataTransfer.files[i]
                const reader: FileReader = new FileReader()
                const fileEntry = new FileEntry(file, reader)
                this.fileMap.set(file.name, fileEntry)
                reader.onload = () => this.onFileLoad(fileEntry)
                reader.readAsArrayBuffer(file)
                this.uploadsInProgress++
            }
        }
        this.setState({numFilesSelected: this.fileMap.size})
        event.preventDefault()
    }

    onFileLoad(fileEntry: FileEntry) {
        fileEntry.contentBase64 = ConversionUtils.arrayBufferToBase64(fileEntry.fileReader.result as ArrayBuffer)
        this.uploadsInProgress--
        this.setState({uploadCount: this.state.uploadCount + 1})
    }

    onDragOver(event: any) {
        event.preventDefault()
    }

    onSubmit(event: any) {
        for (let [fileName, fileEntry] of this.fileMap) {
            const content = {base64: fileEntry.contentBase64, noOverwrite: this.props.noOverwrite}
            const topic = "file:/" + this.folder + "/" + fileName
            MB.publish(topic, content)
        }
        this.onCloseHandler(event)
    }

    onCloseHandler(event: any) {
        MB.publish(this.props.subscribeToTopic, false)
        this.fileMap = new Map<string, FileEntry>()
        this.setState({open: false, numFilesSelected: 0, errorMsg: ""})
    }

    onDelete(fileName: string) {
        this.fileMap.delete(fileName)
        this.setState({uploadCount: this.state.uploadCount - 1})
    }
    
    onListItemClick(fileName: string) {
        this.setState({selectedFileName: fileName})
    }

    getFileListElements(): any {
        let elements : any = [];
        if (this.fileMap.size === 0) {
            elements.push(
                <DialogContentText key={IdGen.next()}>{this.props.prompt3 ?? "No files selected."}</DialogContentText>
            )
            return elements
        }
        for (let [fileName, fileEntry] of this.fileMap) {
            const iconName = fileEntry.contentBase64 ? "Check" : "HourglassEmpty"
            const selected: boolean = (fileName === this.state.selectedFileName)
            elements.push(
                <ListItem key={IdGen.next()} selected={selected} onClick={() => this.onListItemClick(fileName)}>
                    <ListItemIcon>{ReactUtils.resolveIcon(iconName)}</ListItemIcon>
                    <ListItemText>{fileName}</ListItemText>
                    <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => this.onDelete(fileName)}>{ReactUtils.resolveIcon("DeleteTwoTone")}</IconButton>
                    </ListItemSecondaryAction>
                </ListItem>
            )
        }
        return elements
    }

    render() {
        const {id, theme, classes, title, prompt1, prompt2, prompt3, prompt4, buttonLabel, subscribeToTopic, noOverwrite, ...other} = this.props
        const uploadInputRef: React.RefObject<HTMLInputElement> = React.createRef()

        return (
            <Dialog className={classes.root} maxWidth={"xl"} onClose={event => this.onCloseHandler(event)} open={this.state.open} {...other}>
                <Typography variant="h3" style={{padding: "24px"}}>{title}</Typography>
                <IconButton className={classes.closeButton} onClick={event => this.onCloseHandler(event)}>
                    <CloseIcon />
                </IconButton>
                <DialogContent dividers>
                    {this.state.errorMsg && <Alert severity="error">{this.state.errorMsg}</Alert>}
                    <DialogContentText>{prompt1 ?? "Files will be uploaded to the folder"} <b>{this.folder}</b></DialogContentText>
                    <div style={{display: "flex", flexDirection: "row"}}>
                        <div className={classes.dropZone} onDragOver={(event)=>this.onDragOver(event)} onDrop={event => this.onDrop(event)}>
                            <DialogContentText>{prompt2 ?? "Drag one or more files to this Drop Zone or "}
                                <input ref={uploadInputRef} type="file" hidden multiple={true} onChange={event => this.onFilesSelected(event)} />
                                <Button className={classes.browseButton} onClick={() => uploadInputRef.current && uploadInputRef.current.click()}>
                                Browse
                                </Button>.
                            </DialogContentText>
                        </div>            
                        <div className={classes.fileListBox} >
                            <List dense={true}>
                                {this.getFileListElements()}
                            </List>
                        </div>
                    </div>
                    <div  style={{display: "flex", flexDirection: "column"}}>
                        <DialogContentText className={classes.prompt4}>{prompt4 ?? "Any files that already exist on the server won't be overwritten. A version number will be added to the file name."}</DialogContentText>
                        <Button className={classes.submitButton} disabled={this.uploadsInProgress > 0} variant="contained" onClick={(event) => this.onSubmit(event)} color="primary">
                           {buttonLabel ?? "Submit"}
                        </Button>
                    </div>
                </DialogContent>
                <DialogActions style={{padding: "10px"}}> 
                </DialogActions>
            </Dialog>
        )
    }
}

export default withStyles(defaultStyles, {withTheme: true})(UploadFileDialog)