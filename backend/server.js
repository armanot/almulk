const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { google } = require("googleapis");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const credentials = JSON.parse(fs.readFileSync("credentials.json"));
const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    SCOPES
);
const drive = google.drive({ version: "v3", auth });

app.use(express.json());

// Upload Route
app.post("/upload", upload.single("audio"), async (req, res) => {
    try {
        const fileMetadata = {
            name: "voice_recording.wav",
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] // Set a Google Drive folder ID
        };
        const media = {
            mimeType: "audio/wav",
            body: fs.createReadStream(req.file.path),
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id",
        });

        fs.unlinkSync(req.file.path); // Delete local file after upload
        res.json({ message: "File uploaded successfully", fileId: response.data.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Upload failed" });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
