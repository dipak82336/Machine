const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8080;

// ડેટા સ્ટોર કરવા માટેની જગ્યા
const DATA_DIR = 'data';
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const TEXT_HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// ખાતરી કરો કે ડેટા ડિરેક્ટરીઓ અસ્તિત્વમાં છે
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Multer (ફાઇલ અપલોડ) સેટઅપ
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));

// અપલોડ કરેલી ફાઇલોને સાર્વજનિક રીતે ઉપલબ્ધ બનાવવા માટે
app.use('/uploads', express.static(UPLOAD_DIR));

// હિસ્ટ્રી વાંચવા અને લખવા માટેના ફંક્શન
const readHistory = () => {
    try {
        if (fs.existsSync(TEXT_HISTORY_FILE)) {
            const data = fs.readFileSync(TEXT_HISTORY_FILE);
            return JSON.parse(data);
        }
    } catch (err) {
        console.error("Error reading history:", err);
    }
    return [];
};

const writeHistory = (history) => {
    fs.writeFileSync(TEXT_HISTORY_FILE, JSON.stringify(history, null, 2));
};

// મુખ્ય પેજ (GET વિનંતી)
app.get('/', (req, res) => {
    const textHistory = readHistory().reverse(); // નવી એન્ટ્રી પહેલા બતાવો
    const uploadedImages = fs.readdirSync(UPLOAD_DIR).reverse();

    let historyHtml = '<h3>Text History:</h3><ul>';
    textHistory.forEach(entry => {
        historyHtml += `<li><small>${new Date(entry.timestamp).toLocaleString()}</small>: <strong>${entry.text}</strong></li>`;
    });
    historyHtml += '</ul>';
    
    let imagesHtml = '<h3>Uploaded Images:</h3>';
    uploadedImages.forEach(image => {
        imagesHtml += `<a href="/uploads/${image}" target="_blank"><img src="/uploads/${image}" width="150" style="margin:5px; border:1px solid #ccc;"></a>`;
    });

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Data Exchange Test</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                form { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                input[type="text"] { width: 80%; padding: 8px; }
                input[type="submit"] { padding: 8px 15px; }
            </style>
        </head>
        <body>
            <h1>Data Exchange Testing</h1>
            
            <form action="/submit-text" method="POST">
                <h2>Send Text</h2>
                <input type="text" name="userdata" size="50" required>
                <input type="submit" value="Submit Text">
            </form>
            
            <form action="/upload-image" method="POST" enctype="multipart/form-data">
                <h2>Upload Image</h2>
                <input type="file" name="imagefile" required>
                <input type="submit" value="Upload Image">
            </form>

            <hr>
            ${historyHtml}
            <hr>
            ${imagesHtml}
        </body>
        </html>
    `);
});

// ટેક્સ્ટ સબમિટ કરવા માટે (POST વિનંતી)
app.post('/submit-text', (req, res) => {
    const userInput = req.body.userdata;
    const history = readHistory();
    history.push({
        text: userInput,
        timestamp: new Date()
    });
    writeHistory(history);
    res.redirect('/');
});

// ઇમેજ અપલોડ કરવા માટે (POST વિનંતી)
app.post('/upload-image', upload.single('imagefile'), (req, res) => {
    res.redirect('/');
});


app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
