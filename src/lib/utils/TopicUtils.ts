// © 2023 Brill Software Limited - Brill Utils, distributed under the MIT License.

/**
 * Topic Utilities.
 * 
 */

export class TopicUtils {
	static getAppName(topic: string): string {
        const firstSlash = topic.indexOf("/")
		if (firstSlash < 0) {
            console.error(`Unable to get app name from topic ${topic}`)
            throw Error("Expecting a fully qualified topic")
        }
        const secondSlash = topic.indexOf("/", firstSlash + 1)
        if (secondSlash < 0) {
            console.error(`Unable to get app name from topic ${topic}`)
            throw Error("Expecting a fully qualified topic")
        }
        const appName = topic.substring(firstSlash + 1, secondSlash)
        return appName
    }

    static getFileName(topic: string): string {
        const fileName: string | undefined = topic.split('/').pop()
        if (fileName === undefined) {
            return ""
        }
        return fileName
    }

	static getFileExtension(topic: string): string {
		const fileExtension: string | undefined = topic.split('.').pop()
        if (fileExtension === undefined) {
            return ""
        }
		return fileExtension
	}

    /**
     * Gets the file path from the a Topic without the leading slash.
     * e.g. git:delete:/my_app/test.json will return my_app/test.json
     */
    static getPath(topic: string): string {
        let result = topic
        const index = topic.indexOf(":/")
        if (index >= 0) {
            result = topic.substring(index + 2)
        }
        return result
    }

    /**
     * Gets the folder from the a Topic without the leading slash.
     * e.g. git:delete:/my_app/test.json will return my_app
     */
    static getFolder(topic: string): string {
        let result = TopicUtils.getPath(topic)
        const index = result.lastIndexOf("/")
        if (index >= 0) {
            result = result.substring(0, index)
        }
        return result
    }

    /**
     * Changes the file name of a topic.
     * e.g. file:/my_app/oldFileName.json and newFileName.json will return file:/my_app/newFileName.json
     */
    static changeFileName(topic: string, newFileName: string): string {
        let result = topic
        const index = topic.lastIndexOf("/")
        if (index >= 0) {
            result = topic.substring(0, index + 1) + newFileName
        }
        return result
    }

    /**
     * Gets a route from a topic.
     * e.g. json:/myapp/home.json returns /myapp/home
     */
    static getRoute(topic: string): string {
        const firstSlash = topic.indexOf('/')
        const pagesStart = topic.indexOf("/Pages/")
        const lastDot = topic.lastIndexOf('.')
        return topic.substring(firstSlash, pagesStart) + topic.substring(pagesStart + 6, lastDot)
    }

}
