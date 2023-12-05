// © 2021 Brill Software Limited - Brill Utils, distributed under the MIT License.

/**
 * Used by the Edit Component Popover to convert attribute values to and from field text.
 * 
 * An attribute can be a string, number, boolean or object. When saving the attribute 
 * fields, the type needs to be determined so that the correct JSON can be generated. One option to 
 * distinguish the types would be to insist that the user always puts quotes around strings. 
 * This however places a burden on the user and is not very intuitive or obvious to the user
 * as to why quotes are required.
 * 
 * Most of the time it's possibe to guess the type without the need of quotes. If the field
 * starts with '{' and ends with '}' it's an object. If it's all digits it's a number. If it's true
 * or false it's a boolean. 
 * 
 * So the rule is that double quotes are only required when the user wishes to force a number or
 * boolean to explicitly be a string. e.g. Use "123" to store as a string. Use 123 to store as a 
 * number.
 * 
 */

export class FieldUtils {

    static convertToFieldText(value: any): string {
        let result = ""
        switch (typeof value) {
            case "string":
                result = this.handleString(value)
                break
            case "number":
                result += value
                break
            case "bigint":
                result += value
                break
            case "boolean":
                result += value
                break
            case "symbol":
                console.warn("Unexpected field type of type symbol.")
                break
            case "undefined":
                console.warn("Unexpected field type of type undefined.")
                break
            case "object": // Includes null, which is an object!
                result = JSON.stringify(value, null, 1)
                break
            case "function":
                console.warn("Unexpected field type of type function.")
                break
        }
        return result
    }

    private static handleString(value: string): string {
        if (value === "null" || value === "true" || value === "false" || 
                this.containsNumber(value) || (value.startsWith("{") && value.endsWith("}"))) {
            return '"' + value + '"'
        }
        return value
    }

    private static containsNumber(value: string): boolean {
        return /^\d*\.?\d+$/.test(value) || /^\d*e\+?\d+$/.test(value)
    }

    /**
     * Takes a field value and converts it to a string, boolean, number, object or array.
     * 
     * @param fieldText 
     * @returns Object or throws an error.
     */
    static convertToObj(fieldText: string): any {

        if (fieldText.startsWith('"') && fieldText.endsWith('"')) {
            return fieldText.substring(1, fieldText.length - 1)
        }
            
        if (fieldText.startsWith("{") && fieldText.endsWith("}")) {
            return JSON.parse(fieldText) // Could throw an error.
        }

        if (fieldText.startsWith("[") && fieldText.endsWith("]")) {
            return JSON.parse(fieldText) // Could throw an error.
        }

        if (this.containsNumber(fieldText)) {
            return Number(fieldText)
        }

        if (fieldText === "null") {
            return null
        }

        if (fieldText === "true") {
            return true
        }

        if (fieldText === "false") {
            return false
        }

        return fieldText
    }
}