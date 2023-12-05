// © 2022 Brill Software Limited - Brill CMS, distributed under the MIT License.
import React, { Component } from "react"
import { Button, DialogActions, DialogContent, IconButton as MuiIconButton, Popover, TextField, Typography } from '@mui/material'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import CloseIcon from "@mui/icons-material/Close"
import { IdGen } from "lib/utils/IdGen"
import { ErrorUtils } from "lib/utils/ErrorUtils"
import { JsonParser } from "lib/utils/JsonParser"
import { Attributes, PageComponent } from "lib/PageService/Page"
import ToolTip from "@mui/material/Tooltip"
import AddBoxTwoTone from "@mui/icons-material/AddBoxTwoTone"
import DeleteTwoTone from "@mui/icons-material/DeleteTwoTone"
import { FieldUtils } from "lib/utils/FieldUtils"
import { ComponentManager } from "lib/ComponentManager/ComponentManager"
import Draggable from "react-draggable"
// import ThemeProvider from "../material_ui/theme/ThemeProvider"
import withStyles from "@mui/styles/withStyles"

/**
 * Displays a non-modal Popover that allows editing of a components id, module and attributes.
 *
 */

export type EditSaveHandler = (json: string) => void

interface Props {
    id: string
    anchorEl: Element
    title: string
    prompt: string
    fieldLabel: string
    subscribeToTopic: string
    publishToTopic: string
    componentJson: string
    onSave: EditSaveHandler
    [propName: string]: any
}

interface State {
    open: boolean
    numOfAttributes: number
    errorExists: boolean
}

class EditPopover extends Component<Props, State> {
    private static MINIMUM_WIDTH: number = 900
    private static MAXIMUM_WIDTH: number = 1300

    unsubscribeToken: Token
    component: PageComponent
    idFieldValue: string
    idFieldError: string = ""
    moduleFieldValue: string
    moduleFieldError: string = ""
    attrNameField: string[] = []
    attrValueField: string[] = []
    attrValueError: string[] = []
    focusIndex: number = -1
    firstFieldInError: number = -1

    constructor(props: Props) {
        super(props)
        this.state = { open: false, numOfAttributes: 0, errorExists: false }
    }

    componentDidMount() {
        this.unsubscribeToken = MB.subscribe(this.props.subscribeToTopic,
            (topic, data) => this.dataLoadedCallback(topic, data),
            (topic, error) => this.errorCallback(topic, error))
    }

    componentWillUnmount() {
        MB.unsubscribe(this.unsubscribeToken, true)
    }

    dataLoadedCallback(topic: string, data: any) {
        this.component = JsonParser.parse(this.props.componentJson) as PageComponent
        this.idFieldValue = this.component.id
        this.moduleFieldValue = this.component.module
        let entries = Object.entries(this.component.attributes);
        for (const [index, [key, value]] of entries.entries()) {
            this.attrNameField[index] = key
            this.attrValueField[index] = FieldUtils.convertToFieldText(value)
            this.attrValueError[index] = ""
        }
        this.setState({ open: true, numOfAttributes: this.attrNameField.length })
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : " + error.title + " " + error.detail)
    }

    onIdFieldChange(event: any) {
        if (this.idFieldError.length > 0) {
            this.idFieldError = ""
            this.setState({ errorExists: false })
        }
        this.idFieldValue = event.target.value
    }

    onModuleFieldChange(event: any) {
        if (this.moduleFieldError.length > 0) {
            this.moduleFieldError = ""
            this.setState({ errorExists: false })
        }
        this.moduleFieldValue = event.target.value
    }

    onAttrNameChange(event: any, index: number) {
        this.attrNameField[index] = event.target.value
    }

    onAttrValueChange(event: any, index: number) {
        this.attrValueField[index] = event.target.value
    }

    onCloseHandler(event: any) {
        event.stopPropagation()
        this.setState({ open: false })
    }

    onFieldClick(event: any) {
        // Stop clicks on fields also selecting components on the page.
        event.stopPropagation()
        console.log("Field Click handler called")
    }

    onAddClickHandler(event: any, index: number) {
        event.stopPropagation()
        this.attrNameField.splice(index + 1, 0, "")
        this.attrValueField.splice(index + 1, 0, "")
        this.attrValueError.splice(index + 1, 0, "")
        this.focusIndex = index + 1
        this.setState({ numOfAttributes: this.attrNameField.length })
    }

    onDeleteClickHandler(event: any, index: number) {
        event.stopPropagation()
        this.attrNameField.splice(index, 1)
        this.attrValueField.splice(index, 1)
        this.attrValueError.splice(index, 1)
        this.focusIndex = index
        this.setState({ numOfAttributes: this.attrNameField.length })
    }

    createAttributeFields(): React.CElement<any, any>[] {
        let elements: React.CElement<any, any>[] = []

        for (let index = 0; index < this.attrNameField.length; index++) {
            
            // On initial render after a save, set the focus to the first field with an error 
            // and postion the cursor at the location specified in the error message if any.
            let extraProps: any = {}
            if (index === this.firstFieldInError) {
                extraProps.autoFocus = true
                const startPos = this.attrValueError[index].indexOf("JSON at position ")
                if (startPos !== -1) {
                    const attrFieldRef: React.RefObject<unknown> = React.createRef()
                    extraProps.inputRef = attrFieldRef
                    setTimeout(() => this.setJsonErrorCursorPos(this.attrValueError[index].substring(startPos + 17), attrFieldRef), 1)     
                }
                this.firstFieldInError = -1
            }

            elements.push(
                <div style={{ display: "flex", flexDirection: "row" }} key={IdGen.next()}>
                    {/* Name field */}
                    <TextField className="container" label="name" variant="outlined" size="small" onClick={(event) => this.onFieldClick(event)}
                        autoFocus={(this.focusIndex === index)}
                        onChange={(event) => this.onAttrNameChange(event, index)} style={{ width: "270px" }}
                        margin="dense" type="text" fullWidth
                        defaultValue={this.attrNameField[index]}
                        onKeyDown={event => this.onKeyDown(event)}
                    />
                    {/* Attribute field  */}
                    <TextField className="container" label="value" variant="outlined" size="small" onClick={(event) => this.onFieldClick(event)}
                        onChange={(event) => this.onAttrValueChange(event, index)} style={{ marginLeft: "10px" }} multiline
                        margin="dense" type="text" fullWidth
                        defaultValue={this.attrValueField[index]}
                        error={this.attrValueError[index].length > 0}
                        helperText={this.attrValueError[index]}
                        onKeyDown={event => this.onKeyDown(event)}
                        {...extraProps}
                    />
                    {/* Add button */}
                    <div className={this.props.classes.iconRoot}>
                        <ToolTip title="Add another Attribute"><div onClick={(event) => this.onAddClickHandler(event, index)}><AddBoxTwoTone /></div></ToolTip>
                    </div>
                    {/* Delete button */}
                    <div className={this.props.classes.iconRoot}>
                        <ToolTip title="Delete Attribute"><div onClick={(event) => this.onDeleteClickHandler(event, index)}><DeleteTwoTone /></div></ToolTip>
                    </div>
                </div>
            )
        }
        return elements
    }

    setJsonErrorCursorPos(cursorPos: string, attrFieldRef: React.RefObject<any>) {
        if (attrFieldRef === undefined || attrFieldRef.current === undefined || attrFieldRef.current === null) {
            return
        }
        attrFieldRef.current.selectionStart = cursorPos
    }

    async onSaveHandler(event: any) {
        event.preventDefault()
        event.stopPropagation()
        if (this.idFieldValue.length === 0) {
            this.idFieldError = "An id must be specified."
            this.setState({ errorExists: true })
            return
        }
        if (this.moduleFieldValue.length === 0) {
            this.moduleFieldError = "A module must be specified."
            this.setState({ errorExists: true })
            return
        }
        try {
            await ComponentManager.loadComponent(this.moduleFieldValue)
        } catch (e) {
            this.moduleFieldError = "Module is invalid. Unable to load module."
            this.setState({ errorExists: true })
            return
        }

        this.firstFieldInError = -1
        let attribs = new Attributes()
        for (let i = 0; i < this.attrNameField.length; i++) {
            if (this.attrNameField[i].length > 0) {
                try {
                    this.attrValueError[i] = ""
                    const mediaPos = this.attrValueField[i].indexOf("@media")
                    if (mediaPos !== -1) {
                        throw Error(`HTML doesn't support @media queries in style attributes. Use a Theme instead. JSON at position ${mediaPos}`)
                    }
                    attribs[this.attrNameField[i]] = FieldUtils.convertToObj(this.attrValueField[i])
                } catch (e) {
                    this.attrValueError[i] = ErrorUtils.cvt(e).message
                    if (this.firstFieldInError === -1){
                        this.firstFieldInError = i
                        this.setState({ errorExists: true })
                    }   
                }
            }
        }

        if (this.firstFieldInError !== -1) {
            return
        }

        const newComponent = new PageComponent(this.idFieldValue, this.moduleFieldValue, attribs)
        // Copy over the child nodes.
        newComponent.children = this.component.children
        const json = JSON.stringify(newComponent, null, 4)
        this.props.onSave(json)
        this.setState({ open: false })
    }

    /**
     * Allows the user to press Cmd S or Ctrl S to save the changes made in the Edit Popover. 
     */
    onKeyDown(event: React.KeyboardEvent) {
        if ((event.key === 's' && (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey)) ||
            ((event.key === 's' && event.altKey))) {
            this.onSaveHandler(event)
        }   
    }

    /**
     * Displays non-modal dialog with fields and bottons.
     */
    render() {
        if (!this.state.open) {
            return null
        }
        const { classes, anchorEl, title } = this.props

        let width = EditPopover.MINIMUM_WIDTH
        if (anchorEl && anchorEl.clientWidth && anchorEl.clientWidth > EditPopover.MINIMUM_WIDTH) {
            if (anchorEl.clientWidth < EditPopover.MAXIMUM_WIDTH) {
                width = anchorEl.clientWidth
            } else {
                width = EditPopover.MAXIMUM_WIDTH
            }
        }

        const attributeFields: React.CElement<any, any>[] = this.createAttributeFields()

        return (
            // <ThemeProvider themeTopic="json:/brill_cms/Themes/brill_cms_theme_light.json"
            //     themeTopicDark="json:/brill_cms/Themes/brill_cms_theme_dark.json" >
                <Draggable handle=".handle">
                    <Popover style={{ margin: "2px" }}
                        open={this.state.open}
                        anchorEl={anchorEl}
                        disableEnforceFocus={true}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left"
                        }}
                        PaperProps={{ style: { pointerEvents: "auto", opacity: "0.96", width } }}
                        className={classes.root}
                    >
                        <Typography className="handle" variant="h3" style={{ padding: "12px", background: "#f0f0f0", cursor: "move" }}>{title}</Typography>
                        <MuiIconButton className={classes.closeButton} onClick={event => this.onCloseHandler(event)}><CloseIcon /></MuiIconButton>
                        <DialogContent dividers>
                            <form>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {/* id field */}
                                    <TextField label="id" variant="outlined" size="small" onClick={(event) => this.onFieldClick(event)}
                                        onChange={event => this.onIdFieldChange(event)}
                                        autoFocus={(this.focusIndex === -1)}
                                        margin="dense" type="text"
                                        style={{ width: 485 }}
                                        defaultValue={this.component.id}
                                        error={this.idFieldError.length > 0}
                                        helperText={this.idFieldError}
                                        onKeyDown={event => this.onKeyDown(event)}
                                    />
                                    {/* module field */}
                                    <TextField label="module" variant="outlined" size="small" onClick={(event) => this.onFieldClick(event)}
                                        onChange={event => this.onModuleFieldChange(event)}
                                        margin="dense" type="text"
                                        style={{ width: 485 }}
                                        defaultValue={this.component.module}
                                        error={this.moduleFieldError.length > 0}
                                        helperText={this.moduleFieldError}
                                        onKeyDown={event => this.onKeyDown(event)}
                                    />
                                    {/* attribute fields */}
                                    <div className={classes.attributesLabel} style={{ position: "relative" }}>attributes
                                        {/* add button for row 0 */}
                                        <div style={{ position: "absolute", right: "33px", top: "-25px" }} className={this.props.classes.iconRoot} key={IdGen.next()}>
                                            <ToolTip title="Add an Attribute"><div onClick={(event) => this.onAddClickHandler(event, -1)}><AddBoxTwoTone /></div></ToolTip>
                                        </div>
                                    </div>
                                    {attributeFields}
                                </div>
                            </form>
                        </DialogContent>
                        {/* Save and Cancel buttons  */}
                        <DialogActions style={{ padding: "10px" }}>
                            <Button variant="outlined" onClick={event => this.onCloseHandler(event)} color="secondary">Cancel</Button>
                            <Button variant="contained" onClick={event => this.onSaveHandler(event)} color="primary">OK</Button>
                        </DialogActions>
                    </Popover>
                </Draggable>
            // </ThemeProvider>
        )
    }

    static defaultStyles(theme: Theme): any {
        return  {
            root: {
                margin: 0,
                padding: theme.spacing(2),
                pointerEvents: "none",  // Required to make Popover non-modal.
                ...theme.components?.EditPopover?.styleOverrides?.root
            },
            closeButton: {
                position: 'absolute',
                right: theme.spacing(1),
                top: "0px",
                color: theme.palette.grey[600],
                ...theme.components?.EditPopover?.styleOverrides?.closeButton
            },
            attributesLabel: {
                fontFamily: "Helvetica",
                marginTop: "7px",
                marginBottom: "7px"
            },
            iconRoot: {
                color: "#498ada",
                cursor: "pointer",
                marginTop: "18px",
                marginLeft: "10px",
                width: "24px",
                height: "24px",
                ...theme.components?.EditPopover?.styleOverrides?.iconRoot
            }
        }
    }
}

export default withStyles(EditPopover.defaultStyles)(EditPopover)