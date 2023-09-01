// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { AtomicBlockUtils, ContentState, EditorState, Modifier, RichUtils, convertToRaw } from "draft-js"
import { Editor } from "react-draft-wysiwyg"
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css"
import draftToHtml from "draftjs-to-html"
import htmlToDraft from "html-to-draftjs"
import withStyles from "@mui/styles/withStyles"
import { MB, Token } from "lib/MessageBroker/MB"
import { Base64 } from "js-base64"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { CurrentEditor } from "./CurrentEditor"
import { CursorHandler } from "lib/utils/HtmlUtils"
import { EdType, UnsavedChanges } from "./UnsavedChanges"
import ConfirmDialog from "../dialog/ConfirmDialog"
import AlertDialog from "../dialog/AlertDialog"
import { TopicUtils } from "lib/utils/TopicUtils"

/**
 * XHTML WYSIWYG Editor - based on the daft-js-wysiwyg Editor.
 * 
 * The styles for h1 to h6 etc. are obtained from the current theme.
 * 
 */

// const blockStyles = ["header-one", "header-two", "header-three", "header-four", "header-five", "header-six", "unstyled", "pre", "code-block", "blockquote", 
//                     "ordered-list-item", "unordered-list-item"]
// const inlineStyles = ["BOLD", "ITALIC", "UNDERLINE", "STRIKETHROUGH", "CODE"]

interface Props {
    id: string
    theme: Theme
    classes: any
    key: string
    fileName: string
    subscribeToTopic: string
    subscribeToActionTopic?: string
    publishToTopic: string
    publishCurrentStyleTo?: string
    publishTextChangedTopic?: string
    toolbarHidden?: boolean
    [propName: string]: any
 }

 interface State {
    editorState: EditorState
    confirmDialogOpen: boolean
    toolbarHidden: boolean
}

class XhtmlEditor extends Component<Props, State> {
    boundEventHandler: EventListenerOrEventListenerObject
    token: Token
    token2: Token
    tokenCmd: Token
    tokenDisc: Token
    initialHtml: string = ""
    changed: boolean = false
    ignoreNextDataLoadedCallback: boolean = false
    externalChangesMade: boolean = false
    firstDataLoadedCallback: boolean = true
    lastEditorState: EditorState
    //editorRef: React.RefObject<any>

    constructor(props: Props) {
        super(props)
        // this.editorRef = React.createRef()
        this.state = {editorState: EditorState.createEmpty(), confirmDialogOpen: false, toolbarHidden: true}
    }

    componentDidMount() {
        this.token = MB.subscribe(this.props.subscribeToTopic, 
            (topic, data) => this.dataLoadedCallback(topic, data), (topic, error) => this.errorCallback(topic, error))
        if (this.props.subscribeToActionTopic) {
            this.tokenCmd = MB.subscribe(this.props.subscribeToActionTopic, 
                (topic, action) => this.commandCallback(topic, action), (topic, error) => this.errorCallback(topic, error))
        }
        this.tokenDisc = MB.subscribe(`XhtmlEditor.discardChanges.${this.props.id}` , 
            () => this.discardChanges(), (topic, error) => this.errorCallback(topic, error))
        CurrentEditor.set(this.props.id)
        if (this.props.toolbarHidden !== undefined) {
            this.setState({toolbarHidden: this.props.toolbarHidden})
        }
        this.boundEventHandler = (event) => this.handleKeyDown(event)
        document.addEventListener("keydown", this.boundEventHandler, false)
    }

    componentWillUnmount() {
        const xhtml = this.convertStateToHtml(this.state.editorState.getCurrentContent())
        const currentBlockKey = this.state.editorState.getSelection().getStartKey()
        const startOffset = this.state.editorState.getSelection().getStartOffset()
        const currentBlockIndex = this.state.editorState.getCurrentContent().getBlockMap().keySeq().findIndex((k: any) => k === currentBlockKey)
        const position = CursorHandler.convert(xhtml, currentBlockIndex, startOffset)
        const changed = (xhtml !== this.initialHtml)
        UnsavedChanges.add(EdType.XHTML_EDITOR, this.props.subscribeToTopic, null,
            this.state.editorState, xhtml, position.lineNumber, position.column, changed, false, "")
        MB.unsubscribe(this.token)
        MB.unsubscribe(this.token2)
        MB.unsubscribe(this.tokenCmd, true)
        MB.unsubscribe(this.tokenDisc, true)
        document.removeEventListener("keydown", this.boundEventHandler)
    }

    dataLoadedCallback(topic: string, data: any) {
        if (this.ignoreNextDataLoadedCallback) {
            this.ignoreNextDataLoadedCallback = false
            return
        }
        if (this.changed) {
            return // Don't allow unsaved edits to be overwritten by a change in another window.
        }
        if (typeof data === "string") {
            let secondTopic = data.replace("json:/", "file:/")
            this.token = MB.subscribe(secondTopic, (topic, data) => this.secondDataLoadedCallback(topic, data), (topic, error) => this.errorCallback(topic, error))
            return
        }
        this.setEditorText(topic, data)
        this.firstDataLoadedCallback = false
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    secondDataLoadedCallback(topic: string, data: any) {
        MB.unsubscribe(this.token2)
        this.setEditorText(topic, data)
    }

    async handleKeyDown(event: any) {
        // Ignore if we're not the currently active editor.
        if (CurrentEditor.get() !== this.props.id) {
            return
        }
        if (event.key === 's' && (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey)) {
            this.saveCommand()
            event.preventDefault()
            event.stopPropagation()
            return
        }
        if (event.key === "Enter") {
            // Prevent a new line character inside a <pre> block from creating a new block.
            const selection = this.lastEditorState.getSelection()
            const blockType = this.lastEditorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType()
            if (blockType === 'code' && this.lastEditorState) {
                const newContentState = Modifier.insertText(this.lastEditorState.getCurrentContent(), this.lastEditorState.getSelection(), '\n')
                const newEditorState = EditorState.push(this.lastEditorState, newContentState, "insert-characters")
                this.setState({editorState: newEditorState})
                event.preventDefault()
                event.stopPropagation()
                return
            }
        }
    }

    private setEditorText(topic: string, content: any) {
        if (content === null || !content.base64) {
            console.log("Xhtml editor: no content.")
            return
        }
        const html = Base64.decode(content.base64)

        if (UnsavedChanges.exists(this.props.subscribeToTopic)) {
            this.restoreUnsavedChanges(html)
            return
        }
        // No unsaved changes so use loaded content.
        MB.publish(this.props.publishTextChangedTopic, false)
        const blocksFromHTML = htmlToDraft(html)
        const contentState = ContentState.createFromBlockArray(
            blocksFromHTML.contentBlocks,
            blocksFromHTML.entityMap,
          )
        this.initialHtml = this.convertStateToHtml(contentState)
        if (this.initialHtml !== html) {
            const fileName = TopicUtils.getFileName(this.props.subscribeToTopic)
            let msg = `The file ${fileName} may contain modifications that were made outside of the WYSIWYG editor.`
            if (this.initialHtml.indexOf("<table")) {
                msg += " Tables are not supported and will be stripped from the file."
            } else {
                msg += " Any unsupported tags will be stripped from the file."
            }
            MB.publish(`XhtmlEditor.alertDialog.open.${this.props.id}`, msg)
            this.externalChangesMade = true
            this.changed = true
            MB.publish(this.props.publishTextChangedTopic, true)
        }
        const editorState = EditorState.createWithContent(contentState)
        if (this.firstDataLoadedCallback) {
            this.setState({editorState: editorState}, () => this.setFocus() )   
        } else {
            this.setState({editorState: editorState})
        }
    }

    restoreUnsavedChanges(initialHtml: string) {
        const change = UnsavedChanges.getChange(this.props.subscribeToTopic)
        switch (change.editor) {
            case EdType.XHTML_EDITOR:
                this.initialHtml = initialHtml
                this.changed = change.textChanged
                MB.publish(this.props.publishTextChangedTopic, change.textChanged)
                this.setState({editorState: change.viewState}, () => this.setFocus())
                break

            case EdType.TEXT_EDITOR:
                this.initialHtml = initialHtml
                this.changed = change.textChanged
                this.externalChangesMade = change.externalChangesMade
                MB.publish(this.props.publishTextChangedTopic, change.textChanged)
                const blockPos = CursorHandler.convertToXhtmlEditor(change.text, change.cursorLineNumber, change.cursorColumn)       
                const blocksFromHtml = htmlToDraft(change.text)
                const contentState = ContentState.createFromBlockArray(blocksFromHtml.contentBlocks, blocksFromHtml.entityMap)
                let editorState = EditorState.createWithContent(contentState)
                let selectionState = editorState.getSelection()
                const blockArray = editorState.getCurrentContent().getBlocksAsArray()
                if (blockPos.blockNumber >= 0 && blockPos.blockNumber < blockArray.length) {
                    const blockKey = blockArray[blockPos.blockNumber].getKey()
                    selectionState = selectionState.merge({anchorKey: blockKey, anchorOffset: blockPos.offset, focusKey: blockKey, focusOffset: blockPos.offset})
                    editorState = EditorState.forceSelection(editorState, selectionState)
                }     
                this.setState({editorState: editorState}, () => this.setFocus() )
                break

            default:
                console.log(`XhtmlEditor: unexpected unsaved changes editor type: ${change.editor}`)  
        }
        UnsavedChanges.remove(this.props.subscribeToTopic)
    }

    commandCallback(topic: string, action: any) {
        CurrentEditor.set(this.props.id)
        this.setFocus()
        const {command, url, width, height} = action

        switch (command) {
            case "save":
                this.saveCommand()
                break
            case "undo":
                this.onChange(EditorState.undo(this.state.editorState))
                break
            case "redo":
                this.onChange(EditorState.redo(this.state.editorState))
                break
            case "insertImage":
                this.onChange(this.insertImage(url, width, height))
                break
            case "flipToolbar":
                this.setState({toolbarHidden: !this.state.toolbarHidden})
                break
            case "revent":
                this.revert()
                break
            case "header-one":
            case "header-two":
            case "header-three":
            case "header-four":
            case "header-five":
            case "header-six":
            case "unstyled":
            case "pre":
            case "code-block":
            case "blockquote":
            case "ordered-list-item":
            case "unordered-list-item":
                this.onChange(RichUtils.toggleBlockType(this.state.editorState, command))
                break
            case "BOLD":
            case "ITALIC":
            case "UNDERLINE":
            case "STRIKETHROUGH":
            case "CODE":
                this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, command))
                break
            default:
                console.log(`XhtmlEditor: unrecognsed command: ${command}`)
                break
        }
    }

    saveCommand() { 
        const xhtml = this.convertStateToHtml(this.state.editorState.getCurrentContent())
        const content = {base64: Base64.encode(xhtml)}
        // Publishing results in a Data Loaded callback which would loose the cursor position, so supress.
        this.ignoreNextDataLoadedCallback = true
        this.changed = false
        MB.publish(this.props.publishToTopic, content)
        this.initialHtml = xhtml
        MB.publish(this.props.publishTextChangedTopic, false)
    }

    revert() {
        if (this.changed) {
            MB.publish(`XhtmlEditor.discardChangesDialog.open.${this.props.id}`, 
            `Are you sure you want to discard your changes to ${this.props.fileName} and revert back to the last saved version?`)
        }
    }

    discardChanges() {
        const blocksFromHTML = htmlToDraft(this.initialHtml)
        const contentState = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap)
        let editorState = EditorState.createWithContent(contentState)
        this.setState({editorState: editorState})
        this.changed = this.externalChangesMade
        MB.publish(this.props.publishTextChangedTopic, this.changed)  
    }

    insertImage(topic: string, width: string, height: string) {
        let attrs: any = {src: topic}
        if (width) {
            attrs["width"] = width
        }
        if (height) {
            attrs["height"] = height
        }
        const contentState = this.state.editorState.getCurrentContent()
        const contentStateWithEntity = contentState.createEntity(
            "IMAGE",
            "IMMUTABLE",
            attrs)
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
        const newEditorState = EditorState.set( this.state.editorState, { currentContent: contentStateWithEntity })
        return AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, " ")
    }

    onChange(editorState: EditorState) {
        this.lastEditorState = this.state.editorState // Save for use when Enter key press in a pre-formatted block
        CurrentEditor.set(this.props.id)
        const selection = editorState.getSelection()
        const blockType = editorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType()
        MB.publish(this.props.publishCurrentStyleTo, blockType)
        const contentChanged = editorState.getCurrentContent() !== this.state.editorState.getCurrentContent()
        if (this.props.publishTextChangedTopic && contentChanged) {
            // Tell the active tab whether the user has changed the content.
            this.changed = this.initialHtml !== this.convertStateToHtml(editorState.getCurrentContent())
            MB.publish(this.props.publishTextChangedTopic, this.changed)
        }
        this.setState({editorState})
      }

    convertStateToHtml(contentState: ContentState): string {
        const html = draftToHtml(convertToRaw(contentState))
        // Convert any <br>'s to proper XHTML.
        const xhtml = html.replace(new RegExp("<br>","g"), "<br/>")
        return xhtml
    }

    handleKeyCommand(command: string, editorState: EditorState, eventTimeStamp: number) {
        if (command === "save") {
            this.saveCommand()
            return "handled"
        }
        if (command === "add-newline") {
            return "handled"
        }
        const newState = RichUtils.handleKeyCommand(editorState, command)
        if (newState) {
            this.onChange(newState)
            return "handled"
        }
        return "not-handled"
    }

    setFocus() {
        // if (this.editorRef.current) {
        //      this.editorRef.current.focusEditor()
        // }
    }
 
    render() {
        const {id, theme, classes, key, fileName, subscribeToTopic, publishToTopic, toolbarHidden, ...other} = this.props
        const { editorState } = this.state
        return (
            <div className={classes.root}>
                <Editor
                    // ref={this.editorRef}
                    key={key}
                    toolbarHidden={this.state.toolbarHidden}
                    editorState={editorState}
                    wrapperClassName="demo=wrapper"
                    editorClassName="demo-editor"
                    onEditorStateChange={(editorState) => this.onChange(editorState)}
                    handleKeyCommand={(command: any, editorState: any, eventTimeStamp: any) => this.handleKeyCommand(command, editorState, eventTimeStamp)}
                    spellCheck
                    {...other} />

                <ConfirmDialog title="Please confirm" prompt="" 
                    subscribeToTopic={`XhtmlEditor.discardChangesDialog.open.${this.props.id}`}
                    publishToTopic={`XhtmlEditor.discardChanges.${this.props.id}`} />

                <AlertDialog title="External changes made" prompt="" 
                    subscribeToTopic={`XhtmlEditor.alertDialog.open.${this.props.id}`} />
            </div>
        )
    }

    static defaultStyles(theme: Theme): any {
        return  {
            root: {padding: "0px 35px 25px 30px"},
            '@global': {
                h1: { ...theme.typography.h1 },
                h2: { ...theme.typography.h2 },
                h3: { ...theme.typography.h3 },
                h4: { ...theme.typography.h4 },
                h5: { ...theme.typography.h5 },
                h6: { ...theme.typography.h6 },
                p:  { ...theme.typography.body1 },
                blockquote: { ...theme.typography.blockquote },
                pre: { ...theme.typography.pre },
                code: { ...theme.typography.code },
                ul: { ...theme.typography.ul},
                ol: { ...theme.typography.ol},
                img: { ...theme.typography.img },
                figure: { ...theme.typography.body1 }
            },
        }
    }
}

export default withStyles(XhtmlEditor.defaultStyles, { withTheme: true})(XhtmlEditor)