import { asyncHandler } from "../utils/asyncHandler.js";

//her we write main response of request / main logic of in-coming https request

const registerUser = asyncHandler(async (req,res) => {
    res.status(200).json({
        massage:"bro backend is working"
    })
})

export {registerUser}