const {API} = require('./api.js')
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const charJson = 'C:/\Users/\kiril/\TRPO_Git/\chars.json';
const charData = JSON.parse(fs.readFileSync(charJson, 'utf8'));

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'img')));

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

app.get('/index.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.css'));
});

app.get('/game.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.js'));
});

app.get('/offline.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'offline.html'));
});

app.get('/game_offline.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'game_offline.js'));
});

app.get('/top.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'top.html'));
});

app.get('/top.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'top.js'));
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

// async function uploadToImgur(filePath, clientId) {
//   const imageData = fs.readFileSync(filePath, { encoding: 'base64' });

//   const response = await axios.post('https://api.imgur.com/3/image', {
//     image: imageData,
//     type: 'base64'
//   }, {
//     headers: {
//       Authorization: `Client-ID ${clientId}`
//     }
//   });

//   return response.data.data.link; // URL изображения на Imgur
// }

// const { getJson } = require("serpapi");

const apiKey = API;
let respAi;

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 

// async function downloadImageFromUrl(imageUrl, saveDir = 'uploads', fileName = null) {
//   const fs = require('fs');
//   const path = require('path');
//   const axios = require('axios');

//   try {
//     if (!fs.existsSync(saveDir)) {
//       fs.mkdirSync(saveDir, { recursive: true });
//     }

//     const response = await axios.get(imageUrl, { responseType: 'stream' });

//     const finalName = fileName || Date.now() + '-' + path.basename(imageUrl).split('?')[0];
//     const fullPath = path.join(saveDir, finalName);

//     const writer = fs.createWriteStream(fullPath);
//     response.data.pipe(writer);

//     return new Promise((resolve, reject) => {
//       writer.on('finish', () => resolve(fullPath));
//       writer.on('error', reject);
//     });
//   } catch (error) {
//     console.error('Ошибка при скачивании изображения:', error);
//     throw error;
//   }
// }

app.post('/img', upload.none(), async (req, res) => {
  try {
    if (!req.body.url) {
      return res.status(400).send('Файл не был загружен');
    }

    const imageUrl = req.body.url;

    // Первый запрос: Google Lens
    const lensResponse = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_lens',
        url: imageUrl,
        // q: 'who/what is this?',
        api_key: apiKey
      }
    });

		const respAi = lensResponse.data.related_content?.[0]?.query || 'Толстяк';
    console.log(lensResponse.data);
    console.log(respAi);

    // Второй запрос: Google AI Mode
    const aiResponse = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_ai_mode',
        q: `Представь ты придумываешь свой мир гонок без зла и негатива. напиши какую скорость мог бы развивать ${respAi} в мире гонок? Скорость только целое число от 1 до 100. Цвет в hex. Ответ строго в формате JSON: { id: "-", name: "Имя", color: "Цвет", speed: "Скорость", url: "-" }`,
        api_key: apiKey
      }
    });

    const aiResult = aiResponse.data.text_blocks?.[0]?.code || aiResponse.data.text_blocks?.[0]?.snippet;
    console.log(aiResponse.data);
    console.log(aiResult);
    if(aiResult === undefined)
    {
    	aiResult = JSON.stringify({
      "id": 0,
      "name": "Толстяк",
      "color": "#A0522D",
      "speed": 12,
    	"url": "https://st.depositphotos.com/1026550/3824/i/450/depositphotos_38245069-stock-photo-funny-overweight-sports-man.jpg"});
    }
    let jsonAiRes;
		try {
		  jsonAiRes = JSON.parse(aiResult);
		} catch (e) {
		  console.warn('AI ответ невалиден, используем чето ПРОМТ ПОЛОМАЛСЯ ЧТОЛИ');
		}
    const newChuvak = {
		  id: charData.runners.length + 1,
		  name: jsonAiRes.name,
		  color: jsonAiRes.color,
		  speed: jsonAiRes.speed,
		  url: imageUrl
		};

		if(!charData.runners.find(c => c.name === jsonAiRes.name))
		{
		charData.runners.push(newChuvak);
		fs.writeFileSync('C:/\Users/\kiril/\TRPO_Git/\chars.json', JSON.stringify(charData, null, 2), 'utf8');
		console.log('Добавлен:', newChuvak);
		// try {
		//   const saveDir = path.join(__dirname, 'charImgs'); // путь куда сохранять
		//   const fileName = `${newChuvak.name}.png`; // имя файла

		//   const savedPath = await downloadImageFromUrl(imageUrl, saveDir, fileName);

		//   console.log('Изображение сохранено в:', savedPath);
		//   res.json({ message: 'Изображение успешно загружено', path: savedPath });
		// } catch (error) {
		//   res.status(500).send('Ошибка при загрузке изображения');
		// }
	  }
  	res.json({
    message: 'URL успешно обработан!',
    imageUrl,
    object: respAi,
    ai_response: jsonAiRes
    });

  } catch (error) {
    console.error('Ошибка обработки URL:', error);
    res.status(500).send('Ошибка при обработке изображения или генерации данных');
  }
});

app.post('/charDel', upload.none(), async (req, res) => {
	try {

	if(!req.body.charName){
      return res.status(400).send('Json с персонажами не был загружен');
    }

    const name = req.body.charName;

    const filePath = path.join('C:/Users/kiril/TRPO_Git/chars.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(rawData);

    const originalLength = json.runners.length;
    json.runners = json.runners.filter(char => char.name !== name);
    if (json.runners.length === originalLength) {
      return res.status(404).send(`Персонаж "${name}" не найден`);
    }

    json.runners.sort((a, b) => a.id - b.id);
    json.runners.forEach((char, index) => {
      char.id = index + 1;
    });

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    res.status(200).send(`Персонаж "${name}" успешно удалён`);    
  } catch (error) {
    console.error('Ошибка при удалении:', error);
    res.status(500).send('Ошибка при удалении чето');
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