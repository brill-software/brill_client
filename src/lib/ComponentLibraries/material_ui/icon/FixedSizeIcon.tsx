// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { IconUtils } from "lib/utils/IconUtils"
import { Html } from "lib/utils/HtmlUtils"
import withStyles from "@mui/styles/withStyles"
import { Base64 } from "js-base64"

/**
 * Supports Icons that are 24x24 and have a single colour. Supports Material UI Icons from
 * https://material-ui.com/components/material-icons/ and also loaded from Topic /Icons/fixed/*.json
 * 
 * Icons must be of size 24x24. The colour can be set using the color attribute.
 * 
 * SVG Icons from other libraries can be imported as custom icons. Other librbaries are:
 * Material Design Icons: https://materialdesignicons.com/
 * React Icons: https://react-icons.github.io/react-icons/
 * Comercial Icons: https://www.iconfinder.com/
 * 
 * You can also create your own SVG Icons using various SVG editors.
 *  
 */

interface Props {
    id: string
    theme: Theme
    nameOrTopic: string
    [propName: string]: any
}

interface State {
    muiIcon: boolean
    svgHtml: string
}

class FixedSizeIcon extends Component<Props, State> { 
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {muiIcon: false, svgHtml: ""}
    }

    componentDidMount() {
        const {nameOrTopic} = this.props
        //If the topic contains no slash and no '.', it's a MUI Icon name.
        const muiIcon: boolean = !(nameOrTopic && (nameOrTopic.indexOf("/") !== -1 || nameOrTopic.indexOf(".") !== -1))
        if (!muiIcon) {
            this.token = MB.subscribe(this.props.nameOrTopic, (topic, path_d) => this.dataLoadedCallback(topic, path_d), (topic, error) => this.errorCallback(topic, error))
        }
        this.setState({muiIcon: muiIcon})
    }

    componentWillUnmount() {
        if (!this.state.muiIcon) {
            MB.unsubscribe(this.token)
        }
    }

    dataLoadedCallback(topic: string, base64SvgHtml: any) {
        if (base64SvgHtml?.base64) {
            const svgHtml: string = Base64.decode(base64SvgHtml.base64)
            this.setState({svgHtml: svgHtml})
        }
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }    

    render() {
        const {id, theme, classes, nameOrTopic, ...other} = this.props
        
        if (!nameOrTopic) {
            return (
                <div>?</div>
            )
        }

        if (!this.state.muiIcon) { 
            // SVG Icon
            if (this.state.svgHtml.length > 0) {
                return (
                    <div className={classes.svgRoot} {...other}
                    dangerouslySetInnerHTML={{__html: Html.sanitize(this.state.svgHtml)}} /> )
            } 
            return <div>?</div> 
        }

        // Material-UI Icon
        const attribs: any = other
        return IconUtils.resolveIcon(nameOrTopic, attribs)
    }
    
    static defaultStyles(theme: Theme): any {
        return  { svgRoot: {
            height: "24px",
            width: "24px",
            ...theme.components?.FixedSizeIcon?.styleOverrides?.svgRoot }}
    } 
}

export default withStyles(FixedSizeIcon.defaultStyles, {withTheme: true})(FixedSizeIcon)
