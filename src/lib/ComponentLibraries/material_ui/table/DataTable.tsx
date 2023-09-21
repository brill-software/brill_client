// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, { Component } from "react"
import MUIDataTable, { MUIDataTableState } from "mui-datatables"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { Typography, CircularProgress, Popover, Tooltip } from "@mui/material"
import { MB, Token } from "lib/MessageBroker/MB"
import { Filter } from "lib/MessageBroker/TopicEntry"
import classnames from "classnames"
import { IconButton } from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import AddToPhotosIcon from "@mui/icons-material/AddToPhotos"
import DeleteIcon from "@mui/icons-material/Delete"
import MuiTooltip from "@mui/material/Tooltip"
import Router from "lib/Router/Router"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import EmbeddedPage from "../layout/EmbeddedPage"
import Draggable from "react-draggable"
import AddIcon from "@mui/icons-material/Add"
import LoadingIndicator from "lib/ComponentLibraries/html/LoadingIndicator"
import withStyles from "@mui/styles/withStyles"

/**
 * Data table component based on mui-datatables.
 * 
 * The component has two modes of operation. In Server Side mode pages are
 * retrieved from the server a page at a time. Searches, sorting and filtering are
 * performed on the Server. This is the best mode to use when there are tens of thousands or millions
 * of rows.
 * 
 * In Non Server Side mode, all the data is loaded from the Server when the component mounts.
 * All searches, sorting and filtering are perfomed locally on the Client. This is the best mode
 * to use when there are no more than a few thousand rows. The limit is 10,000 rows, but its recomended
 * that the table contains no more than 2,000 rows.
 * 
 * There are some slight differences in searching between the two modes. In Server mode the
 * search depends on the database free text search and this works differently to on the Client. In particular
 * the MySQL Free Text search doesn't work on numberic fields, whereas the Client search does.
 * 
 * The header theme can be set by adding MUIDataTableHeadCell and MUIDataTableSelectCell in the overrides 
 * section of the Theme. For example:
 * 
 * "MUIDataTableHeadCell": {
 *           "fixedHeader": {
 *               "backgroundColor": "#2c9ec2",
 *               "color": "#ddd",
 *               "fontWeight": 800
 *           }
 *       },
 * "MUIDataTableSelectCell": {
 *           "headerCell": {
 *               "backgroundColor": "#2c9ec2",
 *               "paddingLeft": "16px"
 *           }
 *       }
 */

interface Props {
    id: string
    title: string
    classes: any
    columns: any[]
    subscribeToTopic: string
    publishToTopic: string // Used to publish the row object when an action button is clicked.
    newButtonLabel: string
    newButtonTooltip: string
    newRoute?: string
    editRoute?: string
    newPopover: string
    editDialog: string
    deletePopover: string
    subscribeToEditClose: string
    subscribeToNotificationTopic?: string
    duplicateRoute?: string
    deleteRoute?: string
    [propName: string]: any
}

interface State {
    title: string
    data: any[] | undefined
    count: number
    isLoading: boolean
    rowsPerPage: number
    newPopoverOpen: boolean
    editPopoverOpen: boolean
    deletePopoverOpen: boolean
    editData: any
}

const SERVER_SIDE_FALSE_MAX_ROWS: number = 10000

class DataTable extends Component<Props, State> {
    token1: Token
    token2: Token

    

    constructor(props: Props) {
        super(props)
        const rows = props.options.rowsPerPage ? props.options.rowsPerPage : 10
        this.state = { title: this.props.title, data: undefined, count: 0, isLoading: true, rowsPerPage: rows, newPopoverOpen: false, 
            editPopoverOpen: false, deletePopoverOpen: false, editData: null }
    }

    componentDidMount() {
        this.addActionColumn()
        const initialRowCount = this.props.options.serverSide ? this.state.rowsPerPage : SERVER_SIDE_FALSE_MAX_ROWS
        const filter: Filter = new Filter(0, initialRowCount, "", "", "", [], [])
        this.token1 = MB.subscribe(this.props.subscribeToTopic, (topic, obj) => this.dataLoadedCallback(topic, obj), 
            (topic, error) => this.errorCallback(topic, error), filter)
        if (this.props.subscribeToNotificationTopic) {
            this.token2 = MB.subscribe(this.props.subscribeToNotificationTopic, (topic, action) => this.dataLoadedNotification(topic, action), 
                (topic, error) => this.errorCallback(topic, error))
        }
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token1)
        MB.unsubscribe(this.token2, true)
    }

    addActionColumn() {
        const alreadyHasActionCol = this.props.columns.some(element => { return element.name === "Action"})
        if (!alreadyHasActionCol && (this.props.editRoute || this.props.duplicateRoute || this.props.deleteRoute)) {
            const actionCol = {
                name: "Action",
                options: {
                    print: false,
                    download: false,
                    filter: false,
                    sort: false,
                    empty: true,
                    customBodyRender: (value: any, tableMeta: any, updateValue: any) => {
                        return (
                            <div>
                                {this.props.editRoute && (
                                    <MuiTooltip title="Edit">
                                        <IconButton
                                            className={this.props.classes.ActionIcon}
                                            aria-label="Edit"
                                            size="small"
                                            onClick={(event: any) => this.onEditClickHandler(event, value, tableMeta, updateValue)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </MuiTooltip>
                                )}
                                {this.props.duplicateRoute && (
                                    <MuiTooltip title="Duplicate">
                                        <IconButton
                                            className={this.props.classes.ActionIcon}
                                            aria-label="Duplicate"
                                            size="small"
                                            onClick={() => this.onDuplicateClickHandler()}
                                        >
                                            <AddToPhotosIcon />
                                        </IconButton>
                                    </MuiTooltip>
                                )}
                                {this.props.deleteRoute && (
                                    <MuiTooltip title="Delete">
                                        <IconButton
                                            className={this.props.classes.ActionIcon}
                                            aria-label="Delete"
                                            size="small"
                                            onClick={(event: any) => this.onDeleteClickHandler(event, value, tableMeta, updateValue)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </MuiTooltip>
                                )}
                            </div>
                        );
                    }
                }
            }
            this.props.columns.push(actionCol)
        }
    }

    dataLoadedCallback(topic: string, obj: any) {
        this.setState({title: obj.title ?? this.props.title, data: obj.data, isLoading: false, count: obj.count })
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : " + error.title + " " + error.detail)
    }

    dataLoadedNotification(topic: string, action: any) {
        if (action === "closeNewPopover") {
            this.setState({newPopoverOpen: false})
        }
        if (action === "closeEditPopover") {
            this.setState({editPopoverOpen: false})
        }
        if (action === "closeDeletePopover") {
            this.setState({deletePopoverOpen: false})
        }
    }

   onNewClickHandler(event: any) {
        this.setState({newPopoverOpen: true, editPopoverOpen: false, deletePopoverOpen: false})
    }

    onNewPopoverClose() {
        this.setState({newPopoverOpen: false})
    }

    onEditClickHandler(event: any, value: any, tableMeta: any, updateValue: any) {
        this.setState({editPopoverOpen: true, newPopoverOpen: false, deletePopoverOpen: false, editData: tableMeta.tableData[tableMeta.rowIndex]})
        MB.publish(this.props.publishToTopic, tableMeta.tableData[tableMeta.rowIndex])
    }

    onDuplicateClickHandler() {
        Router.goToPage(this.props.route)
    }

    onDeleteClickHandler(event: any, value: any, tableMeta: any, updateValue: any) {
        // Router.goToPage(this.props.route)
        this.setState({deletePopoverOpen: true, newPopoverOpen: false,  editPopoverOpen: false, editData: tableMeta.tableData[tableMeta.rowIndex]})
        MB.publish(this.props.publishToTopic, tableMeta.tableData[tableMeta.rowIndex])
    }

    onEditDialogClose() {
        this.setState({editPopoverOpen: false})
    }

    onDeleteDialogClose() {
        this.setState({deletePopoverOpen: false})
    }

    render() {
        if (this.state.data === undefined) {
            return <LoadingIndicator />
        }

        let { id, classes, theme, title, columns, options, subscribeToTopic, newRoute, editRoute, newPopover, editDialog, deletePopover, duplicateRoute, deleteRoute, ...other } = this.props

        let { count, isLoading } = this.state

        // Zebra stripe the rows
        options["setRowProps"] = (row: any, dataIndex: any, rowIndex: number) => {
            return {
                className: classnames(
                    {
                        [this.props.classes.WhitetRow]: rowIndex % 2 !== 0,
                        [this.props.classes.GreyRow]: rowIndex % 2 === 0
                    })
            };
        }

        if (options.serverSide) {
            options["onTableChange"] = (action: string, tableState: MUIDataTableState | any) => {
                switch (action) {
                    case "changePage":
                    case "changeRowsPerPage":
                    case "sort":
                    case "search":
                    case "filterChange":
                        const colNames: string[] = tableState.columns.map((col: { name: string }) => { return col.name })
                        const filter = new Filter(tableState.page * tableState.rowsPerPage, tableState.rowsPerPage,
                            tableState.sortOrder.name, tableState.sortOrder.direction, tableState.searchText,
                            colNames, tableState.filterList)
                        MB.changeFilter(this.props.subscribeToTopic, filter)
                        break
                    default:
                        break
                }
            }
        }

        options["count"] = count

        if (newPopover) {
            options["customToolbar"] = () => {
                return (
                    <Tooltip title={this.props.newButtonTooltip}>
                        <IconButton className={classes.iconButton} onClick={event => this.onNewClickHandler(event)} {...other}>
                            <AddIcon/>
                            {this.props.newButtonLabel}
                        </IconButton>
                    </Tooltip>
                )
            }
        }

        return (
            <div>
                <MUIDataTable
                    title={<Typography variant="h6">{this.state.title}
                        {isLoading && <CircularProgress size={24} style={{ marginLeft: 15, position: 'relative', top: 4 }} />}
                    </Typography>}
                    columns={columns}
                    options={options}
                    data={this.state.data}
                    {...other} />
                {this.state.editPopoverOpen && (
                    <Draggable handle=".handle">
                        <Popover style={{ margin: "2px" }}
                            open={this.state.editPopoverOpen}
                            onClose={() => this.onEditDialogClose()}
                            disableEnforceFocus={true}
                            PaperProps={{ style: { pointerEvents: "auto", opacity: "0.96" } }}
                            className={classes.editRoot}
                        >
                            <EmbeddedPage id="editDialog" theme={theme} classes="" subscribeToTopic={editDialog} />
                        </Popover>
                    </Draggable>
                )}
                {this.state.deletePopoverOpen && (
                    <Draggable handle=".handle">
                        <Popover style={{ margin: "2px" }}
                            open={this.state.deletePopoverOpen}
                            onClose={() => this.onDeleteDialogClose()}
                            disableEnforceFocus={true}
                            PaperProps={{ style: { pointerEvents: "auto", opacity: "0.96" } }}
                            className={classes.editRoot}
                        >
                            <EmbeddedPage id="deletePopover" theme={theme} classes="" subscribeToTopic={deletePopover} />
                        </Popover>
                    </Draggable>
                )}
                {this.state.newPopoverOpen && (
                    <Draggable handle=".handle">
                        <Popover style={{ margin: "2px" }}
                            open={this.state.newPopoverOpen}
                            onClose={() => this.onNewPopoverClose()}
                            disableEnforceFocus={true}
                            PaperProps={{ style: { pointerEvents: "auto", opacity: "0.96" } }}
                            className={classes.editRoot}
                        >
                            <EmbeddedPage id="deletePopover" theme={theme} classes="" subscribeToTopic={newPopover} />
                        </Popover>
                    </Draggable>
                )}
            </div>
        )
    }

    static defaultStyles(theme: Theme): any {
        return {
            WhitetRow: {
                '& td': {
                    backgroundColor: "#FFFFFF",
                    padding: "0px 16px 0px 16px"
                }
            },
            GreyRow: {
                '& td': {
                    backgroundColor: theme.palette.grey[200],
                    padding: "0px 16px 0px 16px"
                }
            },
            NameCell: {
                fontWeight: 900
            },
            ActionIcon: {
                '&:hover': {
                    color: theme.palette.primary.main
                },
                marginRight: "8px"
            },
            editRoot: {
                margin: 0,
                padding: theme.spacing(2),
                pointerEvents: "none"  // Required to make Popover non-modal.
            }
        }
    }
}

export default withStyles(DataTable.defaultStyles, { withTheme: true })(DataTable)