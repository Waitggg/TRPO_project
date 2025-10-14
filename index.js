const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const haram = {
    vak4: '4vak',
    vak5: '5vak'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Проверяем тип файла (опционально)
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Разрешены только изображения!'), false);
        }
    },
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});

app.use(express.static('public'));

app.get('/haram', (req, res) => {
    res.json(haram);
});

app.get('/index.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.css'));
});

app.get('/game.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.js'));
});

app.post('/img', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Файл не был загружен');
        }

        res.json({
            message: 'Файл успешно загружен!',
            file: {
                originalname: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                url: `/uploads/${req.file.filename}`
            }
        });
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        res.status(500).send('Ошибка при загрузке файла');
    }
});

app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).send('Файл слишком большой');
        }
    }
    res.status(500).send('Что-то пошло не так');
});

app.listen(port, (err) => {
    if (err) {
        return console.log('Error: ', err);
    }
    console.log(`Express server is listening on ${port}`);
});