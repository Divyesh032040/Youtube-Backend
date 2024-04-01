import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
       const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type : "auto"
        })
        console.log("file is uploaded successfully on cloudinary",response.url);
        return response
    } catch (error) {
    //if file upload get error than we will remove it from oue local server too
    fsPromises.unlinkSync(localFilePath)
    return null
        
    }
}

export {uploadOnCloudinary}