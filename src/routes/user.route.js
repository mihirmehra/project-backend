import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    LoginUser , 
    RegisterUser , 
    LogoutUser, 
    RefreshAccessToken,
    ChangeCurrentPassword, 
    GetCurrentUser,
    UpdateAccountDetails,
    UpdateUserAvatar,
    UpdateUserCoverImage,
    GetUserChannelProfile,
    GetWatchHistory
} from "../controllers/user.controller.js";


const router = Router()

router.route('/register').post( upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), RegisterUser )

router.route('/login').post(LoginUser)

// secured routes
router.route('/logout').post(verifyJWT, LogoutUser)
router.route('/refresh-access-token').post(RefreshAccessToken)
router.route('/change-password').post(verifyJWT, ChangeCurrentPassword)
router.route('/user').get(verifyJWT, GetCurrentUser)
router.route('/update-account').patch(verifyJWT, UpdateAccountDetails)
router.route('/update-avatar').patch(verifyJWT, upload.single('avatar'), UpdateUserAvatar)
router.route('/update-cover-image').patch(verifyJWT, upload.single('coverImage'), UpdateUserCoverImage)
router.route('/channel/:username').get(verifyJWT, GetUserChannelProfile)
router.route('/watch-history').get(verifyJWT, GetWatchHistory)

export default router;