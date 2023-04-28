// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { withStyles } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { TreeView as MuiTreeView, TreeItem as MuiTreeItem } from "@material-ui/lab"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { HtmlEntities } from "lib/utils/HtmlEntities"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import ChevronRightIcon from "@material-ui/icons/ChevronRight"
import LoadingIndicator from "lib/ComponentLibraries/html/LoadingIndicator"

/**
 * Xhtml Index - Provides a tree index for a Xhtml component.
 * 
 * When the user clicks on a section in the tree, the section index is published. This is
 * picked up by the Xhtml component and the text scrolled to the corresponding section.
 * 
 */

const defaultStyles: any = (theme: Theme) => {
     return  {
        root: {
            ...theme.overrides?.XhtmlIndex?.root
        }
  }}
  
class TreeNode {
    id: string
    name: string
    children: TreeNode[]
    constructor(id: string, name: string) {
        this.id = id
        this.name = name
        this.children = []
    }
} 

const DEFAULT_EXPAND_LEVEL = 2
interface Props {
    id: string
    theme: Theme
    classes: any
    text?: string // Xhtml text, if the subscribeToTopic is not supplied.
    subscribeToTopic?: string // The Xhtml document.
    publishToTopic: string
    expandLevel?: number // 2 to make all <h2> entries visible,  3 for all <h3>'s visible etc.
    [propName: string]: any
}

interface State {
    treeData: TreeNode | undefined
}

const tagLevel: string[] = ["h1", "h2", "h3", "h4", "h5", "h6"] 

class XhtmlIndex extends Component<Props, State> {
    token: Token
    indexArray: string[]
    expandedIds: string[] = []

    constructor(props: Props) {
        super(props)
        this.state = {treeData: undefined}
    }

    componentDidMount() {
        if (this.props.subscribeToTopic) {
            this.token = MB.subscribe(this.props.subscribeToTopic, (topic, content) => this.dataLoadedCallback(topic, content), 
                (topic, error) => this.errorCallback(topic, error))     
        } else {
            const treeData = this.processPage("<xhtml>" + this.props.text + "</xhtml>")
            this.setState({treeData: treeData})
        }
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
    }

    dataLoadedCallback(topic: string, content: any) {
        let text = atob(content.base64)
        const treeData = this.processPage("<xml>" + text + "</xml>")
        this.setState({treeData: treeData})
    }

    /**
     * Processes the Html and converts it to tree data
     * 
     * @param xml Page XHTML.
     * @returns Tree of nodes. The root node is just a place holder and under that are the <h1>'s.
     */
    processPage(xml: string): TreeNode {
        let treeData: TreeNode = new TreeNode("root", "")
        const xmlText = HtmlEntities.decode(xml) // Convert entities such as &euro; to characters.
        let parser = new DOMParser()
        const dom = parser.parseFromString(xmlText,"application/xhtml+xml")
        const confPageEl = dom.childNodes[0]
        const nodeList: NodeListOf<ChildNode> = confPageEl.childNodes

        for (let i = 0; i < nodeList.length; i++) {
            const node: any = nodeList[i]
            // See if it's a h1, h2, h3 etc.
            const index = tagLevel.findIndex(el => el === node.nodeName)
            if (index !== -1) {
                this.addTreeNode(treeData, 0, i.toString(), node.innerHTML, index + 1)
            }
        }
        return treeData
    }

    addTreeNode(treeNode: TreeNode, treeNodeLevel: number, id: string, name: string, level: number) {
        if (treeNodeLevel === level) {
            treeNode.id = id
            treeNode.name = name
            if (level < (this.props.expandLevel ?? DEFAULT_EXPAND_LEVEL)) {
                this.expandedIds.push(id)
            }
            return
        }
        // If we're one level above the required level, add in a new tree node
        if (treeNodeLevel + 1 === level) {
            const newTreeNode = new TreeNode(id, "")
            treeNode.children.push(newTreeNode)
            this.addTreeNode(newTreeNode, treeNodeLevel + 1, id, name, level)
            return
        }

        // Add in a dummy node if there are no children.
        if (treeNode.children.length === 0) {
            treeNode.children.push(new TreeNode(id, ""))
        }
       
        this.addTreeNode(treeNode.children[treeNode.children.length - 1], treeNodeLevel + 1, id, name, level)
    }

    onClickHandler(event: any, id: string) {
        console.log("Index onclick handler called. elementNum = " + id)
        MB.publish(this.props.publishToTopic, id)
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    renderTreeNode(node: TreeNode) {
        return (
            <MuiTreeItem key={node.id} nodeId={node.id}
                onClick={(event => this.onClickHandler(event, node.id))}
                label={
                    <div>{node.name}</div>
                }>
                   {Array.isArray(node.children) ? node.children.map((childNode) => this.renderTreeNode(childNode)) : null} 
                </MuiTreeItem>
        )
    }

    /**
     * Renders the tree data. In order to support multiple <h1> tags in a docoument, the root node is just a place holder and
     * the <h1> are children of the root node.
     * 
     * @param root 
     * @returns 
     */
    renderTree(root: TreeNode): any[] {
        let elements: any[] = []
        for (let i = 0; i < root.children.length; i++) {
            elements[i] = this.renderTreeNode(root.children[i])
        }
        return elements
    }

    render() {
        const {id, theme, classes, text, subscribeToTopic, publishToTopic, expandLevel, ...other} = this.props        

        if (this.state.treeData === undefined) {
            return <LoadingIndicator />
        }

        return (
            <div {...other}>
                <MuiTreeView
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandIcon={<ChevronRightIcon />}
                    defaultExpanded={this.expandedIds}
                    {...other}>
                        {this.renderTree(this.state.treeData)}
                </MuiTreeView>
            </div>            
        )
    }
}

export default withStyles(defaultStyles, {withTheme: true})(XhtmlIndex)