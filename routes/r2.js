import express from 'express';

import {generateUploadUrl} from '../utils/r2.js'
import { uploadSchema } from '../validation/r2.js';
import validate from '../middleware/validation.js';

const router = express.Router();

router.post('/generate-upload-url', validate(uploadSchema), generateUploadUrl);

export default router;