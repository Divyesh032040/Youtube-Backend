

// Define a class named ApiError that extends the built-in Error class
class ApiError extends Error {
    // Constructor function with default parameter values
    constructor(statusCode, message = "something went wrong", errors = [], stack = "") {
        // Call the constructor of the Error class
        super(message);

        // Initialize properties specific to ApiError
        this.statusCode = statusCode; // HTTP status code of the error
        this.data = null; // Additional data associated with the error (not used here)
        this.message = message; // Error message
        this.success = false; // Flag indicating the request was not successful
        this.errors = errors; // Array of error details

        // If a stack trace is provided, set it; otherwise, capture the stack trace
        if (stack) {
            this.stack = stack; // Provided stack trace
        } else {
            Error.captureStackTrace(this, this.constructor); // Capture stack trace
        }
    }
}

// Export the ApiError class to make it available for use in other files
export { ApiError };
