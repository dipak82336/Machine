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
    const uploadedImages = fs.existsSync(UPLOAD_DIR) ? fs.readdirSync(UPLOAD_DIR).reverse() : [];

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
        <html lang="gu">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>લાઈવ ડેટા એક્સચેન્જ</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 20px; max-width: 900px; margin: auto; line-height: 1.6; }
                .container { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 8px; background-color: #f9f9f9; }
                h1, h2, h3 { color: #333; }
                input[type="text"], input[type="file"] { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
                input[type="submit"] { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
                input[type="submit"]:hover { background-color: #0056b3; }
                ul { list-style-type: none; padding: 0; }
                li { background-color: #fff; border: 1px solid #ddd; margin-bottom: 8px; padding: 10px; border-radius: 4px; }
                small { color: #666; }
            </style>
        </head>
        <body>
            <h1>લાઈવ ડેટા એક્સચેન્જ ટનલ</h1>
            
            <div class="container">
                <h2>ટેક્સ્ટ મોકલો</h2>
                <form action="/submit-text" method="POST">
                    <input type="text" name="userdata" placeholder="અહીં તમારો ડેટા લખો..." required>
                    <input type="submit" value="ટેક્સ્ટ સબમિટ કરો">
                </form>
            </div>
            
            <div class="container">
                <h2>ઇમેજ અપલોડ કરો</h2>
                <form action="/upload-image" method="POST" enctype="multipart/form-data">
                    <input type="file" name="imagefile" accept="image/*" required>
                    <input type="submit" value="ઇમેજ અપલોડ કરો">
                </form>
            </div>

            <hr>
            <div class="container">${historyHtml}</div>
            <hr>
            <div class="container">${imagesHtml}</div>
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
