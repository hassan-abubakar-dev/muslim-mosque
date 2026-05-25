import express from 'express';

import {generateUploadUrl} from '../utils/r2.js'

const router = express.Router();

router.post('/generate-upload-url', generateUploadUrl);

export default router;