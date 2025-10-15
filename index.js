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


const axios = require('axios');

async function uploadToImgur(filePath, clientId) {
  const imageData = fs.readFileSync(filePath, { encoding: 'base64' });

  const response = await axios.post('https://api.imgur.com/3/image', {
    image: imageData,
    type: 'base64'
  }, {
    headers: {
      Authorization: `Client-ID ${clientId}`
    }
  });

  return response.data.data.link; // URL изображения на Imgur
}

// const { getJson } = require("serpapi");

// const axios = require('axios');

const apiKey = "ad161c1bd7316d855f7e3b4cc00265090dc2de28efd4de255a901b4ed6e65fe5"

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

				// const clientId = 'YOUR_IMGUR_CLIENT_ID';
				// const imgurUrl = await uploadToImgur(`/uploads/${req.file.filename}`, clientId);
				// console.log('Imgur URL:', imgurUrl);
				axios.get('https://serpapi.com/search', {
			  params: {
			    engine: 'google_lens',
			    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuwz4z9Y1NR1Z6BzBlrQE_WdYTPWHzWdmx6IDhJmcy5Wfttt8BHnl__VD69AdeTYmpOuvSr2d4bH4jmyxJc5xcdacVk_IZyvwUe2OgOs-NQA",
			    api_key: apiKey
			  }
			})
			.then(response => {
			  console.log('Результат:', response.data);
			})
			.catch(error => {
			  console.error('Ошибка:', error);
			});

	    //   engine: "google_lens",
			//   url: `/uploads/${req.file.filename}`,
			//   api_key: "ad161c1bd7316d855f7e3b4cc00265090dc2de28efd4de255a901b4ed6e65fe5"
			// }, (json) => {
			//   console.log(json["visual_matches"]);

    } catch (error) {
        console.error('Ошибка загрузки:', error);
        res.status(500).send('Ошибка при загрузке файла');
    }
});

// const puppeteer = require('puppeteer');

// app.post('/img', upload.single('file'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send('Файл не был загружен');
//     }

//     const filePath = path.join(__dirname, 'uploads', req.file.filename);
//     const browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();

//     await page.goto('https://yandex.ru/images/', { waitUntil: 'networkidle2' });

//     // Нажимаем на иконку камеры (поиск по изображению)
//     await page.waitForSelector('button[aria-label="Поиск по картинке"]', { timeout: 3000 });
//     await page.click('button[aria-label="Поиск по картинке"]');

//     // Ждём появления input[type="file"]
//     await page.waitForSelector('input[type="file"]', { timeout: 3000 });

//     const inputUploadHandle = await page.$('input[type="file"]');
//     await inputUploadHandle.uploadFile(filePath);

//     // Ждём появления результатов
//     console.log('Текущий URL:', page.url());
//     await page.waitForSelector('.CbirLayoutTemplate-Outlet', { timeout: 6000 });
//     console.log('Текущий URL:', page.url());

//     const title = await page.evaluate(() => {
//       const el = document.querySelector('.CbirLayoutTemplate-Outlet');
//       return el ? el.innerText : 'Объект не найден';
//     });

//     await browser.close();

//     res.json({
//       message: 'Файл успешно загружен!',
//       file: {
//         originalname: req.file.originalname,
//         filename: req.file.filename,
//         size: req.file.size,
//         url: `/uploads/${req.file.filename}`
//       },
//       object: title
//     });
//   } catch (error) {
//     console.error('Ошибка загрузки или парсинга:', error);
//     res.status(500).send('Ошибка при загрузке файла или распознавании объекта');
//   }
// });

// app.post('/img', upload.single('file'), (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).send('Файл не был загружен');
//         }
//         res.json({
//             message: 'Файл успешно загружен!',
//             file: {
//                 originalname: req.file.originalname,
//                 filename: req.file.filename,
//                 size: req.file.size,
//                 url: `/uploads/${req.file.filename}`
//             }
//         });
//     } catch (error) {
//         console.error('Ошибка загрузки:', error);
//         res.status(500).send('Ошибка при загрузке файла');
//     }
// });

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