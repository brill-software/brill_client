// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
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

const defaultToolbarStyles = (theme: Theme) => ({
  iconButton: {
    '&:hover': {
      color: theme.palette.primary.main
    }
  }
})

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
    );
  }

}

export default withStyles(defaultToolbarStyles, { name: "CustomToolbar" })(CustomToolbar);
