import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|webp/;
  const modelTypes = /glb|gltf/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (file.fieldname === 'images') {
    const isImage = imageTypes.test(extname) && mimetype.startsWith('image/');
    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for product images'));
    }
  } else if (file.fieldname === 'model3D') {
    const isModel = modelTypes.test(extname.replace('.', ''));
    if (isModel) {
      cb(null, true);
    } else {
      cb(new Error('Only GLB or GLTF files are allowed for 3D models'));
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const uploadProductImages = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'model3D', maxCount: 1 },
]);

export const uploadSingle = upload.single('image');
