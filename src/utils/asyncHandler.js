// const asyncHandler = (requestHandler) => {
//     return (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
//     }
// }
// export { asyncHandler }
// or

// asyncHandler function takes a requestHandler function as an argument
const asyncHandler = (requestHandler) => {
    // The asyncHandler returns a new function
    return (req, res, next) => {
        // Inside this returned function, we create a Promise using Promise.resolve()
        Promise.resolve(requestHandler(req, res, next))
            // If the requestHandler function resolves the Promise successfully, continue with next middleware
            .catch((err) => next(err)); // If there's an error, pass it to the error-handling middleware
    };
};

// Exporting asyncHandler for use in other files
export { asyncHandler };



// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }





// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}





