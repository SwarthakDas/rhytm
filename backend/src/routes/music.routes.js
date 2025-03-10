import {Router} from "express"
import { generateTabs } from "../controllers/music.controllers.js"
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const router=Router()

router.post("/generate-tabs", upload.single("music"), generateTabs);