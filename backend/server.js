const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { google } = require("googleapis");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

// Load credentials from environment variable
const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
if (!credentialsJson) {
    console.error("❌ Error: GOOGLE_CREDENTIALS_JSON is not set in environment variables!");
    process.exit(1);
}

let credentials;
try {
    credentials = JSON.parse(credentialsJson);
} catch (error) {
    console.error("❌ Error parsing GOOGLE_CREDENTIALS_JSON:", error.message);
    process.exit(1);
}

// Authenticate with Google Drive API
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
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded!" });
    }

    try {
        console.log(`📤 Uploading file: ${req.file.originalname}`);

        const fileMetadata = {
            name: `recording_${Date.now()}.wav`,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] // Set Google Drive folder ID
        };
        const media = {
            mimeType: "audio/wav",
            body: fs.createReadStream(req.file.path),
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id, webViewLink",
        });

        // Delete local file after upload
        fs.unlinkSync(req.file.path);

        console.log(`✅ File uploaded successfully: ${response.data.webViewLink}`);
        res.json({ 
            message: "File uploaded successfully", 
            fileId: response.data.id,
            fileUrl: response.data.webViewLink 
        });
    } catch (error) {
        console.error("❌ Upload failed:", error);
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
