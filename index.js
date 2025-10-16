const {API} = require('./api.js')
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const charJson = 'C:/\Users/\kiril/\TRPO_Git/\chars.json';
const charData = JSON.parse(fs.readFileSync(charJson, 'utf8'));

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

app.get(`/chars`, (req, res) => {
	res.sendFile(path.join(__dirname, 'chars.json'));
});

// app.post('/chars/add', express.json(), (req, res) => {
//   const newChar = req.body;
//   newChar.id = charsData.chuvaki.length + 1;
//   charsData.chuvaki.push(newChar);

//   fs.writeFileSync(jsonPath, JSON.stringify(charsData, null, 2), 'utf8');
//   res.json({ success: true, added: newChar });
// });

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

const apiKey = API;
let respAi;

app.post('/img', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Файл не был загружен');
    }

    const imageUrl = 'https://img.fix-price.by/insecure/rs:fit:800:800/plain/bit/_marketplace/images/origin/c0/c0152ab1a75c29230e6d2271cd434ce5.jpg';

    // Первый запрос: Google Lens
    const lensResponse = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_lens',
        url: imageUrl,
        // q: 'who/what is this?',
        api_key: apiKey
      }
    });

		const respAi = lensResponse.data.related_content?.[0]?.query || 'Толстяк';//?.split(' ')[0]
    console.log(lensResponse.data);
    console.log(respAi);

    // Второй запрос: Google AI Mode
    const aiResponse = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_ai_mode',
        q: `Представь ты устраиваешь вообращаемые гонки. напиши какую скорость мог бы развивать ${respAi} если бы он имел ноги? Скорость только целое числом от 1 до 100(90 - почти невозможная, человек - 20). Цвет в hex. Ответ в формате JSON без /\n: { id: "-", name: "Имя", color: "Цвет", speed: "Скорость" }`,
        api_key: apiKey
      }
    });

    const aiResult = aiResponse.data.text_blocks?.[0]?.code || aiResponse.data.text_blocks?.[0]?.snippet;
    console.log(aiResponse.data);
    console.log(aiResult);
    const jsonAiRes = JSON.parse(aiResult);
    const newChuvak = {
		  id: charData.runners.length + 1,
		  name: jsonAiRes.name,
		  color: jsonAiRes.color,
		  speed: jsonAiRes.speed
		};

		charData.runners.push(newChuvak);
		fs.writeFileSync('C:/\Users/\kiril/\TRPO_Git/\chars.json', JSON.stringify(charData, null, 2), 'utf8');
		console.log('Добавлен:', newChuvak);

    res.json({
      message: 'Файл успешно загружен!',
      file: {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      },
      object: respAi,
      ai_response: aiResult
    });

  } catch (error) {
    console.error('Ошибка загрузки или парсинга:', error);
    res.status(500).send('Ошибка при загрузке файла или распознавании объекта');
  }
});

// app.post('/img', upload.single('file'), (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).send('Файл не был загружен');
//         }

// 				axios.get('https://serpapi.com/search', {
// 			  params: {
// 			    engine: 'google_lens',
// 			    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuwz4z9Y1NR1Z6BzBlrQE_WdYTPWHzWdmx6IDhJmcy5Wfttt8BHnl__VD69AdeTYmpOuvSr2d4bH4jmyxJc5xcdacVk_IZyvwUe2OgOs-NQA",
// 			    q: 'who is this?',
// 			    api_key: apiKey
// 			  }
// 			})
// 			.then(response => {
// 			  console.log('Результат:', response.data.title.split(" ")[0]);
// 			  respAi = response.data.title.split(" ")[0];
// 			})
// 			.catch(error => {
// 			  console.error('Ошибка:', error);

// 			  axios.get('https://serpapi.com/search', {
// 			  params: {
// 			    engine: 'google_ai_mode',
// 			    q: `напиши какую среднюю скорость мог бы развивать ${respAi} в гонке, ответ мне нужен в виде json, пример: { name: "Имя", color: "Цвет по образцу: (#FE6B6B)", speed: Скорость }`,
// 			    api_key: apiKey
// 			  }
// 			})
// 			.then(response => {
// 			  console.log('Результат:', response.data.title.split(" ")[0]);
// 			  respAi = response.data.title.split(" ")[0];
// 			})
// 			.then(
// 				  	res.json({
//             message: 'Файл успешно загружен!',
//             file: {
//                 originalname: req.file.originalname,
//                 filename: req.file.filename,
//                 size: req.file.size,
//                 url: `/uploads/${req.file.filename}`
//             }
//         });
// 			})
// 			.catch(error => {
// 			  console.error('Ошибка:', error);

// 			});
//     } catch (error) {
//         console.error('Ошибка загрузки:', error);
//         res.status(500).send('Ошибка при загрузке файла');
//     }
// };

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