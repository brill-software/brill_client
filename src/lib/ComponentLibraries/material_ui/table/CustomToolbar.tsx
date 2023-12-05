// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, {Component} from "react"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import AddIcon from "@mui/icons-material/Add"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import Router from "lib/Router/Router"
import withStyles from "@mui/styles/withStyles"

/**
 * DataTable Custom Toolbar compnent.
 * 
 */

interface Props {
    classes: any
    newRoute: string
    [propName: string]: any
}

interface State {
}

class CustomToolbar extends Component<Props, State> {
  
    onNewClickHandler() {
        Router.goToPage(this.props.newRoute)
    }

    render() {
        const { classes, newRoute, ...other } = this.props;

        return (
            <React.Fragment>
                <Tooltip title={"Create new entry"}>
                    <IconButton className={classes.iconButton} onClick={() => this.onNewClickHandler()} {...other}>
                        <AddIcon/>
                        New
                    </IconButton>
                </Tooltip>
            </React.Fragment>
        )
    }

    static defaultStyles(theme: Theme): any {
        return {
            iconButton: {
                '&:hover': {
                    color: theme.palette.primary.main
                }
            }
        }
    }
}

export default withStyles(CustomToolbar.defaultStyles)(CustomToolbar)
