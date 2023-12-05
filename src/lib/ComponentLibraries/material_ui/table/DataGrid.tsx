// © 2023 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, { Component } from "react"
import { DataGrid as MuiDataGrid, GridColDef } from '@mui/x-data-grid';
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"

/**
 * Data Grid Component - based on the MUI v6 Data Grid Component.
 * 
 */

const DEFAULT_MAX_ROWS: number = 1000

class TableData {
    data: any[]
    offset: number
    row_count: number
}

interface Props {
    rowHeight?: number // Pixels
    columns: GridColDef<Object>[]
    maxRows?: number
    subscribeToTopic: string
    [propName: string]: any
}

interface State {
    rows: any[]
}

export default class DataGrid extends Component<Props, State> {
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {rows: []}
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
        // The MUI DataGrid requires that a column called "id" must exist.
        // If there's no "id" column, add it and fill with the row number.
        for (let i = 0; i < table.data.length; i++) {
            if (table.data[i].id === undefined) {
                table.data[i].id = i + 1
            }
        }

        this.setState({rows: table.data})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    render() {
        const {rowHeight, subscribeToTopic, columns, ...other} = this.props

        if (!this.state.rows) {
            return null
        }

        return (
            <MuiDataGrid
                rowHeight={rowHeight}
                rows={this.state.rows}
                columns={columns}
                {...other}
            />
        )
    }
}