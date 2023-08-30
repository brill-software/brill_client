// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import ConfirmDialog from "lib/ComponentLibraries/material_ui/dialog/ConfirmDialog"
import AlertDialog from "lib/ComponentLibraries/material_ui/dialog/AlertDialog"
import withStyles from "@mui/styles/withStyles"
import {Base64} from "js-base64"
import ReactQuill from "react-quill"
import "./quill.brill.css"
import { CurrentEditor } from "./CurrentEditor"
import { EdType, UnsavedChanges } from "./UnsavedChanges"

/**
 * XHTML WYSIWYG Editor - based on the Facebook daft-js Rich Text Editor.
 * 
 * Supports a massive amount of functionality. The styles for h1 to h6 etc. are obtained from the current theme.
 * 
 * The following are not currently supported:
 *      - Tables
 *      - Links
 *      - Paste of images
 *      - Fonts and colors
 *      - Right and centre justification
 *   
 * 
 * Known issues and limitations:
 * 
 * 1) With a large document when switching to the TextEditor and back the document doesn't always scoll correctly to make the cursor visible. This is due to a
 *    bug with the browser Content Editable functionality.
 * 
 * 2) Images are displayed just as an icon, rather than actually displaying the image. The image can be checked in Preview mode.
 * 
 * 3) Cursor positioning is sometimes out when switching to the Text Editor for nested ordered and unordered lists. 
 * 
 * 4) The TextEditor can be used to add unsupported tags such as for tables but any unsupported tags get stripped when using the XhtmlEditor.
 * 
 * For more information on the Facebook draft-js editor see: https://draftjs.org/
 * 
 */

const blockStyles = ["header-one", "header-two", "header-three", "header-four", "header-five", "header-six", "unstyled", "pre", "code-block", "blockquote", 
                    "ordered-list-item", "unordered-list-item"]
const inlineStyles = ["BOLD", "ITALIC", "UNDERLINE", "STRIKETHROUGH", "CODE"]

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
    [propName: string]: any
 }

 interface State {
    html: string | undefined
    confirmDialogOpen: boolean
}

class HtmlEditor extends Component<Props, State> {
    //editorRef: any
    token: Token
    unsubscribeSecondToken: Token
    unsubscribeTokenCmd: Token
    unsubscribeTokenDisc: Token
    initialHtml: string = ""
    changed: boolean = false
    externalChangesMade: boolean = false
    ignoreNextDataLoadedCallback: boolean = false
    firstDataLoadedCallback: boolean = true

    firstOnChangeCall: boolean = false;

    reactQuillRef: any

    currentHtml: string

    confirmPrompt: string = ""

    constructor(props: Props) {
        super(props)
        // this.editorRef = React.createRef()
        this.state = {html: undefined, confirmDialogOpen: false}
    }

    componentDidMount() {
        this.token = MB.subscribe(this.props.subscribeToTopic, 
            (topic, data) => this.dataLoadedCallback(topic, data), 
            (topic, error) => this.errorCallback(topic, error))
        if (this.props.subscribeToActionTopic) {
             this.unsubscribeTokenCmd = MB.subscribe(this.props.subscribeToActionTopic, 
                (topic, action) => this.commandCallback(topic, action), 
                (topic, error) => this.errorCallback(topic, error))
        }
        // this.unsubscribeTokenDisc = MB.subscribe(`XhtmlEditor.discardChanges.${this.props.id}` , () => this.discardChanges(), (topic, error) => this.errorCallback(topic, error))
        CurrentEditor.set(this.props.id)
    }

    componentWillUnmount() {
        console.log("XhtmlEditor will unmount.")
        // const xhtml = this.convertStateToHtml(this.state.editorState.getCurrentContent())
        // const currentBlockKey = this.state.editorState.getSelection().getStartKey()
        // const startOffset = this.state.editorState.getSelection().getStartOffset()
        // const currentBlockIndex = this.state.editorState.getCurrentContent().getBlockMap().keySeq().findIndex((k: any) => k === currentBlockKey)
        // const position = CursorHandler.convert(xhtml, currentBlockIndex, startOffset)
        // const changed = (xhtml !== this.initialHtml)
        UnsavedChanges.add(EdType.HTML_EDITOR, this.props.subscribeToTopic, null,
             null, this.currentHtml, 0, 0, this.changed, this.externalChangesMade, "")
        MB.unsubscribe(this.token)
        MB.unsubscribe(this.unsubscribeSecondToken)
        MB.unsubscribe(this.unsubscribeTokenCmd, true)
        MB.unsubscribe(this.unsubscribeTokenDisc, true)
    }

    dataLoadedCallback(topic: string, data: any) {
        if (this.ignoreNextDataLoadedCallback) {
            this.ignoreNextDataLoadedCallback = false
            return
        }
        if (this.changed) {
            return // Don't allow unsaved edits to be overwritten.
        }
        if (typeof data === "string") {
            let secondTopic = data.replace("json:/", "file:/")
            this.unsubscribeSecondToken = MB.subscribe(secondTopic, (topic, data) => this.secondDataLoadedCallback(topic, data), (topic, error) => this.errorCallback(topic, error))
            return
        }
        this.setEditorText(topic, data)
        this.firstDataLoadedCallback = false
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }
    
    secondDataLoadedCallback(topic: string, data: any) {
        MB.unsubscribe(this.unsubscribeSecondToken)
        this.setEditorText(topic, data)
    } 

    private setEditorText(topic: string, content: any) {
        if (content === null || !content.base64) {
            console.log("Html editor: no content.")
            return
        }
        
        this.initialHtml = Base64.decode(content.base64)
        // this.setState({html: html})
        // this.initialHtml = html

        if (UnsavedChanges.exists(this.props.subscribeToTopic)) {
             const change = UnsavedChanges.getChange(this.props.subscribeToTopic)
             if (change.editor === EdType.HTML_EDITOR) {
        //         this.initialHtml = html
                this.changed = change.textChanged
                //this.externalChangesMade = change.externalChangesMade
                MB.publish(this.props.publishTextChangedTopic, change.textChanged)
                this.setState({html: change.text})
                this.currentHtml = change.text
                UnsavedChanges.remove(this.props.subscribeToTopic)
                return
            }
        //     if (change.editor === EdType.TEXT_EDITOR) {
        //         this.initialHtml = html
        //         this.changed = change.textChanged
        //         this.externalChangesMade = change.externalChangesMade
        //         MB.publish(this.props.publishTextChangedTopic, change.textChanged)
        //         const blockPos = CursorHandler.convertToXhtmlEditor(change.text, change.cursorLineNumber, change.cursorColumn)       
        //         const blocksFromHTML = convertFromHTML(change.text)
        //         const contentState = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap)
        //         let editorState = EditorState.createWithContent(contentState)
        //         let selectionState = editorState.getSelection()
        //         const blockArray = editorState.getCurrentContent().getBlocksAsArray()
        //         if (blockPos.blockNumber >= 0 && blockPos.blockNumber < blockArray.length) {
        //             const blockKey = blockArray[blockPos.blockNumber].getKey()
        //             selectionState = selectionState.merge({anchorKey: blockKey, anchorOffset: blockPos.offset, focusKey: blockKey, focusOffset: blockPos.offset})
        //             editorState = EditorState.forceSelection(editorState, selectionState)
        //         }     
        //         this.setState({editorState: editorState}, () => this.setFocus() )
        //         UnsavedChanges.remove(this.props.subscribeToTopic)
        //         return
        //     }
        }

        // No unsaved changes
        MB.publish(this.props.publishTextChangedTopic, false)
        this.firstOnChangeCall = true
        this.setState({html: this.initialHtml})
        // if (this.initialHtml !== html) {
        //     const fileName = TopicUtils.getFileName(this.props.subscribeToTopic)
        //     MB.publish(`XhtmlEditor.alertDialog.open.${this.props.id}`,
        //         `The file ${fileName} may contain modifications that were made outside of the WYSIWYG editor. Any unsupported tags will be stripped from the file.`)
        //     this.externalChangesMade = true
        //     this.changed = true
        //     MB.publish(this.props.publishTextChangedTopic, true)
        // }
        // const editorState = EditorState.createWithContent(contentState)
        // if (this.firstDataLoadedCallback) {
        //     this.setState({editorState: editorState}, () => this.setFocus() )   
        // } else {
        //     this.setState({editorState: editorState})
        // }
    }

    // keyBindingFn(event: any): string | null {
        // if (event.keyCode === 83 /* S */ && KeyBindingUtil.hasCommandModifier(event)) {
        //     return "save"
        // }
        // // Prevent a new line character inside a <pre> block from creating a new paragraph.
        // const selection = this.state.editorState.getSelection();
        // const blockType = this.state.editorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType()
        // if (event.keyCode === 13 /* Newline */ && blockType === 'code-block') {
        //     const newContentState = Modifier.insertText(this.state.editorState.getCurrentContent(), this.state.editorState.getSelection(), '\n')
        //     const newEditorState = EditorState.push(this.state.editorState, newContentState, "insert-characters")
        //     this.onChange(newEditorState)
        //     return 'add-newline'
        // }
        // return getDefaultKeyBinding(event)
   // }

    // blockStyleFn(block: ContentBlock): string {
    //     const type = block.getType()
    //     switch (type) {
    //         case "header-one":
    //             return this.props.classes.header1
    //         case "header-two":
    //             return this.props.classes.header2
    //         case "header-three":
    //             return this.props.classes.header3
    //         case "header-four":
    //             return this.props.classes.header4
    //         case "header-five":
    //             return this.props.classes.header5
    //         case "header-six":
    //             return this.props.classes.header6
    //         case "unstyled":
    //             return this.props.classes.p
    //         case "blockquote":
    //                 return this.props.classes.blockquote
    //         case "code-block":
    //             return this.props.classes.pre
    //         case "unordered-list-item":
    //             return this.props.classes.ul   
    //         case "ordered-list-item":
    //             return this.props.classes.ol
    //     }
    //     return ""
    // }

    onChange(value: string, delta: any, source: any, editor: ReactQuill.UnprivilegedEditor ) {
        this.currentHtml = value
        if (this.firstOnChangeCall) {
            // Quill reformats the html on initial load.
            this.initialHtml = value
            this.firstOnChangeCall = false
            return
        }

        const newChanged = (this.initialHtml !== this.currentHtml)
        if (this.props.publishTextChangedTopic && this.changed !== newChanged) {
            this.changed =  newChanged
            MB.publish(this.props.publishTextChangedTopic, this.changed)
        }

        // CurrentEditor.set(this.props.id)
        // const selection = editorState.getSelection();
        // const blockType = editorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType()
        // MB.publish(this.props.publishCurrentStyleTo, blockType)
        // const contentChanged = editorState.getCurrentContent() !== this.state.editorState.getCurrentContent()
        // if (this.props.publishTextChangedTopic && contentChanged) {
        //     // Tell the active tab whether the user has changed the content.
        //     this.changed = this.initialHtml !== this.convertStateToHtml(editorState.getCurrentContent())
        //     MB.publish(this.props.publishTextChangedTopic, this.changed)
        // }
        // this.setState({editorState})
    }

    // convertStateToHtml(contentState: ContentState): string {
    //     const options = {
    //         blockRenderers: {
    //             "code-block": (block: ContentBlock) => {
    //                 return "<pre>" + HtmlEntities.escape(block.getText()) + "</pre>"
    //             }
    //         }
    //     }
    //     const html = stateToHTML(contentState, options)
    //     const xhtml = html.replace(new RegExp("<br>","g"), "<br/>")
    //     const result = HtmlEntities.convert(xhtml)
    //     return result
    // }

    customSaveCommand() {
    //     const xhtml = this.convertStateToHtml(this.state.editorState.getCurrentContent())
    //     const content = {base64: Base64.encode(xhtml)}
    //     // Publishing results in a Data Loaded callback which would loose the cursor position, so supress.
        this.ignoreNextDataLoadedCallback = true
        this.changed = false
        const content = {base64: Base64.encode(this.currentHtml)}
        MB.publish(this.props.publishToTopic, content)
        this.initialHtml = this.currentHtml
        MB.publish(this.props.publishTextChangedTopic, false)
    }

    commandCallback(topic: string, action: any) {
    //     CurrentEditor.set(this.props.id)
    //     this.setFocus()
        const {command, url, width, height } = action
        if (command === "save") {
            this.customSaveCommand()
            return
        }

        if (command === "BOLD") {
            this.reactQuillRef.getEditor().format("bold")
            return
        }
    //     if (command === "undo") {
    //         this.onChange(EditorState.undo(this.state.editorState))
    //         return
    //     }
    //     if (command === "redo") {
    //         this.onChange(EditorState.redo(this.state.editorState))
    //         return
    //     }
    //     if (command === "insertImage") {
    //         this.onChange(this.insertImage(url, width, height))
    //         return
    //     }
    //     if (blockStyles.indexOf(command) !== -1) {
    //         this.onChange(RichUtils.toggleBlockType(this.state.editorState, command))
    //         return
    //     }
    //     if (inlineStyles.indexOf(command) !== -1) {
    //         this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, command))
    //         return
    //     }
    //     if (command === "revert" && this.changed) {
    //         this.revert()
    //         return
    //     }
    }

    revert() {
        MB.publish(`XhtmlEditor.discardChangesDialog.open.${this.props.id}`, 
            `Are you sure you want to discard your changes to ${this.props.fileName} and revert back to the last saved version?`)
    }

    // discardChanges() {
    //     const blocksFromHTML = convertFromHTML(this.initialHtml)
    //     const contentState = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap)
    //     let editorState = EditorState.createWithContent(contentState)
    //     this.setState({editorState: editorState})
    //     if (this.externalChangesMade) {
    //         this.changed = true
    //         MB.publish(this.props.publishTextChangedTopic, true)
    //     } else {
    //         this.changed = false
    //         MB.publish(this.props.publishTextChangedTopic, false)
    //     }   
    // }

    // handleKeyCommand(command: string, editorState: EditorState, eventTimeStamp: number) {
    //     if (command === "save") {
    //         this.customSaveCommand(editorState)
    //         return "handled"
    //     }
    //     if (command === "add-newline") {
    //         return "handled"
    //     }
    //     const newState = RichUtils.handleKeyCommand(editorState, command)
    //     if (newState) {
    //         this.onChange(newState)
    //         return "handled"
    //     }
    //     return "not-handled"
    // }

    // setFocus() {
    //     if (this.editorRef.current) {
    //         this.editorRef.current.focus()
    //     }
    // }

    // insertImage(topic: string, width: string, height: string) {
    //     let attrs: any = {src: topic}
    //     if (width) {
    //         attrs["width"] = width
    //     }
    //     if (height) {
    //         attrs["height"] = height
    //     }
    //     const contentState = this.state.editorState.getCurrentContent()
    //     const contentStateWithEntity = contentState.createEntity(
    //         "IMAGE",
    //         "IMMUTABLE",
    //         attrs)
    //     const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    //     const newEditorState = EditorState.set( this.state.editorState, { currentContent: contentStateWithEntity })
    //     return AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, " ")
    // }

    undo() {
        this.reactQuillRef.getEditor().history.undo()
    }

    redo() {
        this.reactQuillRef.getEditor().history.redo()
    }
 
    render() {
        const {id, theme, classes, key, fileName, subscribeToTopic, publishToTopic, ...other} = this.props

        if (this.state.html === undefined) {
            return <div>Loading HTML...</div>
        }

        var icons = ReactQuill.Quill.import("ui/icons");
        icons["undo"] = '<svg viewbox="0 0 18 18"><polygon class="ql-fill ql-stroke" points="6 10 4 12 2 10 6 10"></polygon><path class="ql-stroke" d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"></path></svg>'
        icons["redo"] = '<svg viewbox="0 0 18 18"><polygon class="ql-fill ql-stroke" points="12 10 14 12 16 10 12 10"></polygon><path class="ql-stroke" d="M9.91,13.91A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"></path></svg>'

        const modules = {
            history: {
                delay: 2000,
                maxStack: 500,
                userOnly: true
            },
            toolbar: {container: [
              [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
              ['bold', 'italic', 'underline', 'strike', 'blockquote'],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
              ['link', 'image', 'video'],
              [{ 'color': [] }, { 'background': [] }],  
              ['undo', 'redo'],
            ],
            handlers: {
                'undo' : () => this.undo(),
                'redo' : () => this.redo()
                }
            }
        }

        const formats = [
            'header',
            'bold', 'italic', 'underline', 'strike', 'blockquote',
            'list', 'bullet', 'indent',
            'link', 'image', 'color', 'background',
            'image', 'video'
          ]

        return (
            <div className={classes.root}>
                <ReactQuill
                    ref={(el) => {this.reactQuillRef = el}} 
                    value={this.state.html}
                    // preserveWhitespace={true}
                    modules={modules}
                    formats={formats}
                    onChange={(value, delta, source, editor) => this.onChange(value, delta, source, editor)}
                />


                {/* <DraftJSEditor
                    key={key}
                    ref={this.editorRef}        
                    editorState={this.state.editorState}
                    onChange={(editorState: any) => this.onChange(editorState)} 
                    handleKeyCommand={(command: any, editorState: any, eventTimeStamp: any) => this.handleKeyCommand(command, editorState, eventTimeStamp)}
                    keyBindingFn={(event: any) => this.keyBindingFn(event)} 
                    blockStyleFn={(block: any) => this.blockStyleFn(block)}
                    spellCheck 
                    {...other} /> */}
                
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
            root: {}
        }
    }
}

export default withStyles(HtmlEditor.defaultStyles, { withTheme: true})(HtmlEditor)