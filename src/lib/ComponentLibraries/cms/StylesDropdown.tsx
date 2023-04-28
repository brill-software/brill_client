// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {Component} from "react"
import { withStyles } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"

/**
 * Brill CMS Styles Dropdown for use by the XHTML WYSIWYG Editor.
 *
 */

 export interface StylesDropdownOverrides {
    root: object
    select: object
}

 const defaultStyles: any = (theme: Theme) => {
    const root = (theme.overrides?.StylesDropdownOverrides?.root) ? theme.overrides.StylesDropdownOverrides.root : {}
    const select = (theme.overrides?.StylesDropdownOverrides?.select) ? theme.overrides.StylesDropdownOverrides.select : {}
    return  {
        root: {
            color: "#498ada",
            marginLeft: "20px",
            ...root
        },
        select: {
            color: "#498ada",
            background: "#c9c9c9",
            borderWidth: "0px",
            fontSize: "1.0rem",
            paddingTop: "2px",
            fontWeight: 600,
            ...select
        }
    }
}

interface Props {
    id: string // Must be unique. Used to delete component when last edit window is closed.
    theme: Theme
    classes: any
    subscribeToTopic: string
    publishToTopic: string
    [propName: string]: any
}

interface State {
    value: string
}

class StylesDropdown extends Component<Props, State> {
    unsubscribeToken: Token

    constructor(props: Props) {
        super(props)
        this.state = {value: "header-one"}
    }

    componentDidMount() {
        this.unsubscribeToken = MB.subscribe(this.props.subscribeToTopic, 
            (topic, selectValue) => this.dataLoadedCallback(topic, selectValue), 
            (topic, error) => this.errorCallback(topic, error))
    }    

    dataLoadedCallback(topic: string, selectValue: string) {
          this.setState({value: selectValue })
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    handleChange(event: React.ChangeEvent<{value: unknown}>) {
        MB.publish(this.props.publishToTopic, {command: event.target.value as string})
    }

    render() {
        const {id, theme, classes, subscribeToTopic, publishToTopic, ...other} = this.props

        return (
            <div className={classes.root} {...other}>
                <select className={classes.select} value={this.state.value} 
                    onChange={(event) => this.handleChange(event)}>
                    <option value={"header-one"}>Heading 1</option>
                    <option value={"header-two"}>Heading 2</option>
                    <option value={"header-three"}>Heading 3</option>
                    <option value={"header-four"}>Heading 4</option>
                    <option value={"header-five"}>Heading 5</option>
                    <option value={"header-six"}>Heading 6</option>
                    <option value={"unstyled"}>Paragraph</option>
                    <option value={"blockquote"}>Blockquote</option>
                    <option value={"code-block"}>Preformatted</option>
                </select>
            </div>
        )
    }
}

export default withStyles(defaultStyles, { name: "StylesDropdown", withTheme: true})(StylesDropdown)