
import multer from "multer"

// Set up storage for file uploads
const storage = multer.diskStorage({
    // Specify where files should be stored
    destination: function (req, file, cb) {
      // Store files in the '/tmp/my-uploads' folder
      cb(null, './public/temp')
    },
    // Specify how files should be named
    filename: function (req, file, cb) {
      // Use the original name of the file as the filename
      cb(null, `${file.originalname}`)
    }
  })
  
  // Create an upload middleware using multer with the defined storage settings
  export const upload = multer({ storage })
  