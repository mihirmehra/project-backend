import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET_KEY 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        
        console.log("the file is uploaded on cloudinary")
        fs.unlinkSync(localFilePath) 

        return response

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temp file as the upload is failed
        return null;
    }
}

const deleteFromCloudinary = async (FilePath) => {
    try {
        if(!FilePath) return null;

        const response = await cloudinary.uploader.destroy(FilePath, {
            resource_type: "auto"
        })
        
        console.log("the file is deleted form cloudinary")

        return response

    } catch (error) {
        return null;
    }
}

export {uploadOnCloudinary , deleteFromCloudinary}