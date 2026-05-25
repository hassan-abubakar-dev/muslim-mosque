import express from "express";
import { getAllAdzkar } from "../controllers/adzkar.js";

const router = express.Router();    

router.get("/get-all", getAllAdzkar);

export default router; 