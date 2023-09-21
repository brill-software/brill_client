// © 2021 Brill Software Limited - Brill Message Broker, distributed under the MIT License.
export class ErrorMsg {
    public static ERROR_SEVERITY = "error"
    public static WARNING_SEVERITY = "warning"
    public static INFO_SEVERITY = "info"
    public static SUCCESS_SEVERITY = "success"

    public title: string
    public detail: string
    public severity: string // error, warning , info or success

    constructor(title: string, detail: string, severity: string = ErrorMsg.ERROR_SEVERITY) {
        this.title = title
        this.detail = detail
        this.severity = severity
    }
}