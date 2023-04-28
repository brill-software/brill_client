// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.

/**
 * Error Utilities.
 * 
 */



export class ErrorUtils {

    // Converts an error of type 'any' to type 'Error'.
    static cvt(error: any): Error {
        if (error instanceof Error) {
            return error;
        }
        if (typeof error === "string") {
            return new Error(error)
        }
        if (typeof error === "number") {
            return new Error(`{error}`)
        }
        if (typeof error === "boolean") {
            return new Error(`{error}`)
        }
        return new Error("Unexpected type of error encountered. Type is " + typeof error);
    }
}