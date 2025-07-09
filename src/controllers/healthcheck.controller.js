import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {

    if(req.error){
        throw new ApiError(400, "Somethig Went Wrong")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Everything is Working fine"
        )
    )
})

export {
    healthcheck
    }
    