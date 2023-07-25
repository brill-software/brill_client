// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { HtmlEntities } from "lib/utils/HtmlEntities"
import { IdGen } from "lib/utils/IdGen"
import parse from "style-to-object"
import LoadingIndicator from "lib/ComponentLibraries/html/LoadingIndicator"
import withStyles from "@mui/styles/withStyles"

/**
 * Xhtml - Displays a XHTML document.
 * 
 * The XHTML is either supplied using the text prop or obtained by subscribing to a topic.
 * 
 * The XHTML only includes the tags found within a <body> section. 
 * It doesn't include the <html>, <header> or <body> tags.
 * 
 */

const defaultStyles: any = (theme: Theme) => {
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
    root: {
        ...theme.components?.Xhtml?.styleOverrides?.root
    },
    parserError: {
        ...theme.components?.Xhtml?.styleOverrides?.parserError
    }
  }}

interface Props {
    theme: Theme
    classes: any
    text: string
    subscribeToTopic: string
    subscribeToIndexTopic?: string // Used to scroll to a header selected in a XhtmlIndex
    scrolling?: string // 'auto' or 'smooth'
    [propName: string]: any
}

interface State {
    elements: React.DOMElement<any,any>[] | undefined
}

// Note that tables must be within a paragraph rather than at the top level. The same also for <hr> tags.
const htmlTags: string[] = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "blockquote", "pre", "code","ul", "ol", "table", "th", "tr", "td"] 

class Xhtml extends Component<Props, State> {
    token1: Token
    token2: Token
    nodeRef: React.RefObject<unknown>[] = []

    constructor(props: Props) {
        super(props)
        this.state = {elements: undefined}
    }

    componentDidMount() {
        if (this.props.subscribeToTopic) {
            this.token1 = MB.subscribe(this.props.subscribeToTopic, 
                (topic, content) => this.dataLoadedCallback(topic, content), 
                (topic, error) => this.errorCallback(topic, error))     
        } else {
            const els = this.processPage("<xhtml>" + this.props.text + "</xhtml>")
            this.setState({elements: els})
        }
        if (this.props.subscribeToIndexTopic) {
            this.token2 = MB.subscribe(this.props.subscribeToIndexTopic, 
                (topic, id) => this.scrollCallback(topic, id), 
                (topic, error) => this.errorCallback(topic, error))
        }
    }

    componentDidUpdate(oldProps: Props) {
        if (oldProps.text !== this.props.text) {
            const els = this.processPage("<xhtml>" + this.props.text + "</xhtml>")
            this.setState({elements: els})
        }
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token1)
        MB.unsubscribe(this.token2, true)
    }

    dataLoadedCallback(topic: string, content: any) {
        let text = atob(content.base64)
        const els = this.processPage("<xhtml>" + text + "</xhtml>")
        this.setState({elements: els})
    }

    /**
     * Processes the Html and convert it to an array of React Elements.
     * 
     * @param xml Page XHTML.
     */
    processPage(xml: string): React.DOMElement<any,any>[] {
        let reactElements: Array<React.DOMElement<any,any>> = new Array<React.DOMElement<any,any>>()
        const xmlText = HtmlEntities.decode(xml) // Convert entities such as &euro; to characters.
        let parser = new DOMParser()
        const dom = parser.parseFromString(xmlText,"application/xhtml+xml")
        const confPageEl = dom.childNodes[0]
        const nodeList: NodeListOf<ChildNode> = confPageEl.childNodes

        for (let i = 0; i < nodeList.length; i++) {
            const node: any = nodeList[i]
            this.nodeRef[i] = React.createRef()
            if (htmlTags.indexOf(node.nodeName) > -1) {
                reactElements.push(this.createHtmlElement(node, this.nodeRef[i]))
            } else         
            if (node.nodeName === "img") {
                reactElements.push(this.createImgElement(node, this.nodeRef[i]))
            } else
            if (node.nodeName === "figure") {
                reactElements.push(this.createFigureElement(node, this.nodeRef[i]))
            } else
            if (node.nodeName === "parsererror") {
                MB.error(this.props.subscribeToTopic, new ErrorMsg("Error parsing XHML page.", node.innerText))
                reactElements.push(this.createParserErrorElement(node))
            } else
            if (node.nodeName !== "#text") {
                console.warn(`XHTML tag <${node.nodeName}> not supported. Tag ignored.`)
            }      
        }
        return reactElements
    }

    /**
     * Handles h1, h2, h3, h4, h5, h6, p, blockquote, pre, code, ul and ol tags.
     */
    createHtmlElement(node: any, ref: React.RefObject<unknown>): React.DOMElement<any, any> {
        const innerHtml = node.innerHTML
        const html = {__html: innerHtml}
        let props: any = {ref: ref, key: IdGen.next(), dangerouslySetInnerHTML: html}
        const style = node.getAttribute("style")
        if (style !== null) {
            props["style"] = parse(style.replace(/-(.)/g, (m:any,p:any) => p.toUpperCase()))
        }
        const el: any = React.createElement(node.nodeName, props)
        return el
    }

    /**
     * Handles blocks of code.
     */
    createPreElement(node: any): React.DOMElement<any, any> {
        const textNode = this.getChild(node, "ac:plain-text-body")
        const cdataNode = this.getChild(textNode, "#cdata-section")
        const text = cdataNode.nodeValue?.replace(new RegExp("&lt;","g"), '<').replace(new RegExp("&gt;","g"), '>')
        const props: object = {key: IdGen.next()}
        const preEl = React.createElement("pre", props, text)
        return preEl
    }

    /**
     * Handles an <img> tag. The src attribute is the topic for the image, not a URL.
     */
    createImgElement(imgNode: any, ref: React.RefObject<unknown>): React.DOMElement<any, any> {
        if (!this.hasAttribute(imgNode, "src")) {
            return this.createErrorElement("<b>Attribute Error:</b><br />An &lt;img&gt; tag must have a <b>src</b> attribute, which specifies the image topic.")
        }
        const imageTopic = this.getAttribute(imgNode, "src")
        let props: any = {key: IdGen.next(), src: "", ref: ref}
        // Convert the height and width to a style attribute
        let width = this.getAttribute(imgNode, "width")
        let height = this.getAttribute(imgNode, "height")
        if (width || height) {
            let style: any = {}
            if (width) {
                width = width.endsWith("px") ? width : width + "px"
                style["width"] = width
            }
            if (height) {
                height = height.endsWith("px") ? height : height + "px"
                style["height"] = height
            }
            props["style"] = style
        }
        const imgEl = React.createElement("img", props)
        MB.subscribe(imageTopic, (topic, data) => this.imageLoaded(topic, data, ref), (topic, error) => this.errorCallback(topic, error))
        return imgEl
    }

    /**
     * Handles a <figure> tag, which is expected to contain an <img> tag.
     */
    createFigureElement(node: any, ref: React.RefObject<unknown>): React.DOMElement<any, any> {
        if (!this.hasChild(node,"img")) {
            return this.createErrorElement("<b>Tag Error:</b><br />A &lt;figure&gt; tag is expected to contain an &lt;img&gt; tag.")
        }
        return this.createImgElement(this.getChild(node, "img"), ref)
    }

    /**
     * Callback for loading an image.
     * 
     * @param topic
     * @param image 
     * @param createdRef 
     */
    imageLoaded(topic: string, image: string, createdRef: any) {
        if (createdRef && createdRef.current) {
            createdRef.current.src = image
        }  
    }

    /**
     * Create an element for displaying an error within the page.
     */
    createErrorElement(errorHtml: string): React.DOMElement<any, any> {       
        const html = {__html: errorHtml}
        const props: object = {key: IdGen.next(), dangerouslySetInnerHTML: html, className: this.props.classes.parserError}
        const errorEl = React.createElement("div", props)
        return errorEl
    }

    /**
     * Displays any parser errors at the top of the page.
     */
    createParserErrorElement(node: any): React.DOMElement<any, any> {       
        const innerHtml = node.innerHTML
        const html = {__html: innerHtml}
        const props: object = {key: IdGen.next(), dangerouslySetInnerHTML: html, className: this.props.classes.parserError}
        const errorEl = React.createElement("div", props)
        return errorEl
    }

    /**
     * Returns true if the node contains a child with the tag.
     * 
     * @param node Node to search.
     * @param tag Tag to search for.
     */
    hasChild(node: Node, tag: string): boolean {
        for (let i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeName === tag) {
                return true
            }
        }
        return false
    }
    
    /**
     * Returns a child node that matches the tag supplied.
     * 
     * @param node Node to search.
     * @param tag Tag to search for.
     */
    getChild(node: Node, tag: string): Node {
        for (let i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeName === tag) {
                return node.childNodes[i]
            }
        }
        return node
    }

    hasAttribute(node: any, name: string): boolean {
        if (node.attributes) {
            for (let i = 0; i < node.attributes.length; i++) {
                if (node.attributes[i].nodeName === name) {
                    return true
                }
            }
        }
        return false
    }

    getAttribute(node: any, name: string): string {
        if (node.attributes) {
            for (let i = 0; i < node.attributes.length; i++) {
                if (node.attributes[i].nodeName === name) {
                    return node.attributes[i].nodeValue
                }
            }
        }
        return ""
    }
     
    /**
     * Scrolls to a section of the document when the user clicks on a section in an index.
     * 
     * @param topic 
     * @param id The document element index, as a string.
     */
    scrollCallback(topic: string, id: string) {
        const elIndex = parseInt(id)
        const ref: any = this.nodeRef[elIndex]
        if (ref && ref.current) {
            ref.current.scrollIntoView({behavior: this.props.scrolling ?? "auto"})
        }
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    render() {
        const {theme, classes, text, subscribeToTopic, subscribeToIndexTopic, ...other} = this.props        

        if (this.state.elements === undefined) {
            return <LoadingIndicator />
        }

        return (     
            <div className={classes.root} {...other}>
                {this.state.elements}
            </div>
        )
    }
}

export default withStyles(defaultStyles)(Xhtml)