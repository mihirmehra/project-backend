import { Router } from "express";
import { LoginUser , RegisterUser , LogoutUser, RefreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


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

export default router;