// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, { Component, DOMElement } from "react"
import { TableContainer as MuiTableContainer, Paper as MuiPaper, Table as MuiTable, TableBody as MuiTableBody, TableHead as MuiTableHead, TableRow as MuiTableRow, TableCell as MuiTableCell, withTheme } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"

/**
 * Table Component - based on the MUI Table Component.
 * 
 */

const DEFAULT_MAX_ROWS: number = 1000

class TableData {
    data: Object[]
    offset: number
    row_count: number
}

class Column {
    name: any
    label: String
}

interface Props {
    theme: Theme
    size? : "small" | "medium" | undefined
    columns: Column[]
    maxRows?: number
    subscribeToTopic: string
    [propName: string]: any
}
 
interface State {
    data: Object[]
}

class Table extends Component<Props, State> {
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {data: []}
    }

    componentDidMount() {
        if (this.props.subscribeToTopic) {
            const filter = {offset: 0, row_count: this.props.maxRows ?? DEFAULT_MAX_ROWS}
            this.token = MB.subscribe(this.props.subscribeToTopic, (topic, table) => this.dataLoadedCallback(topic, table), 
                (topic,error) => this.errorCallback(topic, error), filter)
        }
    } 

    componentWillUnmount() {
        MB.unsubscribe(this.token, true)
    }

    dataLoadedCallback(topic: string, table: TableData) {
            this.setState({data: table.data})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    createHeaderCells(): React.DOMElement<any,any>[] {
        let reactElements: Array<React.DOMElement<any,any>> = new Array<React.DOMElement<any,any>>()
        for (const [index, col] of this.props.columns.entries()) {
            const cell: any = (
                <MuiTableCell align={index === 0 ? "left" : "right"}>
                    <b>{col.label}</b>
                </MuiTableCell>
            )
            reactElements.push(cell)
        }
        return reactElements
    }

    createRows(): React.DOMElement<any,any>[] {
        let reactElements: Array<React.DOMElement<any,any>> = new Array<React.DOMElement<any,any>>()
        for (const [rowNum, rowData] of this.state.data.entries()) {
            if (rowNum === (this.props.maxRows ?? DEFAULT_MAX_ROWS)) {
                break
            }
            const row: any = (
                <MuiTableRow key={rowNum}>
                    {this.createRowCells(rowData)}
                </MuiTableRow>
            )
            reactElements.push(row)
        }
        return reactElements
    }

    createRowCells(rowData: any) {
        let reactElements: Array<React.DOMElement<any,any>> = new Array<React.DOMElement<any,any>>()
        for (const [colNum, col] of this.props.columns.entries()) {
            const cell: any = (
                <MuiTableCell align={colNum === 0 ? "left" : "right"}>
                    {rowData[col.name]}
                </MuiTableCell>
            )
            reactElements.push(cell)
        }
        return reactElements
    }

    render() {
        const {subscribeToTopic, columns, size, ...other} = this.props

        return (
            <div {...other}>
                <MuiTableContainer component={MuiPaper}>
                    <MuiTable size={size}>
                        <MuiTableHead>
                            <MuiTableRow>
                                {this.createHeaderCells()}
                            </MuiTableRow>        
                        </MuiTableHead>
                        <MuiTableBody>
                            {this.createRows()}
                        </MuiTableBody>
                    </MuiTable>
                </MuiTableContainer>
            </div>
        )
    }
}

export default withTheme(Table)