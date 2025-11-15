const {API} = require('./api.js')
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const secret = "52";

const charJson = 'C:/\Users/\kiril/\TRPO_Git/\chars.json';
const charData = JSON.parse(fs.readFileSync(charJson, 'utf8'));

const PARTOFPATH = "C:/Users/kiril/TRPO_Git/";

const http = require('http');
const WebSocket = require('ws');
const port = 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const gameChars = {
  characters: [],
  players: [],
  readyPlayers: []
};


let raceInProgress = false;
let raceInterval = null;
let finishLine = 1650; // пикселей
let participants = []; // массив объектов: { token, name, speed, position, finished }

wss.on('connection', socket => {
  socket.on('message', msg => {
    const data = JSON.parse(msg);

    if (data.type === 'readyToRace') {
      if (data.token && !gameChars.readyPlayers.includes(data.token)) {
        gameChars.readyPlayers.push(data.token);
      }

      // Когда все готовы — запускаем гонку
      if (gameChars.readyPlayers.length === gameChars.players.length && gameChars.players.length > 0) {
        console.log('Все готовы, запускаем гонку');
			if (
			  gameChars.readyPlayers.length === gameChars.players.length &&
			  gameChars.players.length > 0 &&
			  participants.length > 0
			) {
			  startRaceOnServer();
			}
      }
    }
    if(data.type === 'slowDownCharacter') // тут делать
    {
    	if(!raceInProgress)
    	{
    		console.log('Нажимается только в гонке!');
    		return;
    	}
		      setTimeout(() => {
		      charElement.dataset.speed = originalSpeed;
		      charElement.dataset.slowed = 'false';
		      newP1.textContent = `Скорость восстановлена`;
		      
		      setTimeout(() => {
		          if (newP1.parentNode) {
		              newP1.remove();
		          }
		      }, 2000);
		      
		  }, slowDownDuration);
    }
  });
});

function startRaceOnServer() {
  if (raceInProgress) {
    console.log('Гонка уже идёт');
    return;
  }

  if (participants.length === 0) {
    console.log('Нет участников');
    return;
  }

  raceInProgress = true;
  participants.forEach(p => {
    p.position = 0;
    p.finished = false;
    p.finishTime = null;
  });

  const startTime = Date.now();

  raceInterval = setInterval(() => {
    let finishedCount = 0;
    let topFinishers = [];

    participants.forEach((p,index) => {
      if (p.finished) {
      	if(index <= 3)
      	{
      		topFinishers[index] = p;
      	}
        finishedCount++;
        return;
      }


      const visualSpeed = getVisualSpeed(p.speed);
      p.position += Math.max(10,p.speed+visualSpeed);
      console.log(p.name, p.position, Math.max(10,p.speed+visualSpeed))

      if (p.position >= finishLine) {
        p.position = finishLine;
        p.finished = true;
        p.finishTime = Date.now() - startTime;
        finishedCount++;
      }
    });

    // Рассылаем текущие позиции всем клиентам
    wss.clients.forEach(cl => {
      if (cl.readyState === WebSocket.OPEN) {
        cl.send(JSON.stringify({
          type: 'raceUpdate',
          positions: participants.map(p => ({
            token: p.token,
            name: p.name,
            position: p.position,
            finished: p.finished
          }))
        }));
      }
    });
  

    // Если все финишировали — завершить гонку
    if (finishedCount === participants.length) {
      clearInterval(raceInterval);
      raceInProgress = false;

      const results = participants
        .filter(p => p.finished)
        .sort((a, b) => a.finishTime - b.finishTime);

      wss.clients.forEach(cl => {
        if (cl.readyState === WebSocket.OPEN) {
          cl.send(JSON.stringify({
            type: 'raceFinished',
            results,
            topFinishers
          }));
        }
      });

      console.log('Гонка завершена');
    }
  }, 20); // каждые 100 мс
}

function getVisualSpeed(baseSpeed) {
  // const randomChange = Math.floor(Math.random() * 3) + 1;
  const randomChange = Math.floor(Math.random() * 21) - 10;
  // return Math.max(1, baseSpeed + randomChange);
  return randomChange;
}

wss.on('connection', (client) => {
  console.log('Клиент подключился');

  client.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.type === 'addCharacter') {
			let filePath = path.join(`${PARTOFPATH}users.json`);
			let rawData = fs.readFileSync(filePath, 'utf8');
			const usersJson = JSON.parse(rawData);
			const user = usersJson.users.find(u => u.token === data.character.owner);

      gameChars.characters.push(data.character);
      if(!gameChars.players.includes(user.token))
      {
      	gameChars.players.push(user.token);
    	}

      participants.push({
		  token: data.character.owner,
		  name: data.character.name,
		  speed: data.character.speed,
		  position: 0,
		  finished: false,
		  url: data.character.url
		});


      // Рассылаем всем, кроме отправителя
      wss.clients.forEach(other => {
        if (other !== client && other.readyState === WebSocket.OPEN) {
          other.send(JSON.stringify({
            type: 'characterAdded',
            character: data.character,
            userToken: user.token
          }));
        }
      });

    }
    if(data.type === 'deleteCharacter')
    {
    		let filePath = path.join(`${PARTOFPATH}users.json`);
				let rawData = fs.readFileSync(filePath, 'utf8');
				const usersJson = JSON.parse(rawData);
				const user = usersJson.users.find(u => u.token === data.character.owner);

				gameChars.characters = gameChars.characters.filter(char => char.name !== data.character.name); 
				gameChars.players = gameChars.players.filter(player => player.name !== user.username); 
				gameChars.readyPlayers = gameChars.readyPlayers.filter(player => player.name !== user.username); 
				   		
    	  wss.clients.forEach(other => {
        if (other !== client && other.readyState === WebSocket.OPEN) {
          other.send(JSON.stringify({
            type: 'characterDeleted',
            character: data.character,
            userToken: user.token
          }));
        }
      });
    }
    if(data.type === 'startRace')
    {
    	  let filePath = path.join(`${PARTOFPATH}users.json`);
				let rawData = fs.readFileSync(filePath, 'utf8');
				const usersJson = JSON.parse(rawData);
				const user = usersJson.users.find(u => u.token === data.token);

			  if (!gameChars.readyPlayers.find(u => u.token === user.token)) {
			    gameChars.readyPlayers.push(user.token);
			  }

				if(gameChars.readyPlayers.length > gameChars.players.length / 2)
				{
    	  wss.clients.forEach(cl => {
        if (cl.readyState === WebSocket.OPEN) {
          cl.send(JSON.stringify({
            type: 'startRace',
            userToken: user.token
          }));
        }
      });
    	}
    }


  });
});

server.listen(3000, () => {
  console.log('Сервер слушает на порту 3000');
});

function hs256(message, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  const signature = hmac.digest('base64');
  return signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

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

// const upload = multer({ 
//     storage: storage,
//     fileFilter: function (req, file, cb) {
//         if (file.mimetype.startsWith('image/')) {
//             cb(null, true);
//         } else {
//             cb(new Error('Разрешены только изображения!'), false);
//         }
//     },
//     limits: {
//         fileSize: 20 * 1024 * 1024
//     }
// });

const upload = multer();

app.use(express.static('public'));

app.get('/index.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.css'));
});

app.get('/game.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.js'));
});

app.get('/offline.html', (req, res) => {
		// if(req.body.token)
		// {
		// 	res.json({
	  //   success: true,
	  //   message: 'Все классно обработано все ок!',
	  //   token: req.body.token,
	  //   });
		// }
		// else {
		// 		return res.status(200).json({ success: false, message: 'Токен нето' });
		// 		res.sendFile(path.join(__dirname, 'offline.html'));
	  // }

	// if (!req.body.token) {
  //   return res.status(200).send('Токен не передан');
  // }

  // console.log('Получен токен:', token);

  res.sendFile(path.join(__dirname, 'offline.html'));
});

app.get('/game_offline.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'game_offline.js'));
});

app.get('/top.html', upload.none(), (req, res) => {
     res.sendFile(path.join(__dirname, 'top.html'));
});

// app.get('/top.html', upload.none(), (req, res) => { // чето тут надо сделать чтобы переходилось и токен передавалось но впадлу
// 	try {
// 		if(req.body.token)
// 		{
// 			const token = req.body.token;

// 	    const filePath = path.join('C:/Users/kiril/TRPO_Git/users.json');
// 	    const rawData = fs.readFileSync(filePath, 'utf8');
// 	    const json = JSON.parse(rawData);
	    
// 	    const user = json.users.find(u => u.token === token);
// 	    if(user)
// 	    {
// 	    		res.status(200).json({ success: true, username: user.username });   

// 	    }
// 	    else
// 	    {
// 	    		res.status(200).json({ success: false });   
// 	    }

// 		}

    
//     res.sendFile(path.join(__dirname, 'top.html'));
//   } catch (error) {
//     console.error('Ошибка при входе:', error);
//     res.status(500).send('Ошибка при входе чето');
//   }

// });

app.get('/top.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'top.js'));
});

// app.post(`/chars`, (req, res) => {
// 	console.log(res.body.token);
// 	if(req.body.token)
// 	{
// 		let filePath = path.join('C:/Users/kiril/TRPO_Git/users.json');
//     let rawData = fs.readFileSync(filePath, 'utf8');
//     const usersJson = JSON.parse(rawData);
//     const user = json.users.find(u => u.token === req.body.token);
//     if(!user)
//     {
//       return res.status(400).send('Токен нето');	
//     }

// 		filePath = path.join('C:/Users/kiril/TRPO_Git/chars.json');
//     rawData = fs.readFileSync(filePath, 'utf8');
//     const charsJson = JSON.parse(rawData);
//     let charsOfOwner = [];
//    	for(let i = 1; i < charsJson.runners.length+1; i++)
//     {
//     	charsOfOwner[i-1] = json.users.find(c => c.owner === user.username);
//   	}
//   	console.log(charsOfOwner);
//   	res.send(charsOfOwner);
// 		//res.sendFile(path.join(__dirname, 'chars.json'));
// 	}
// 	else
// 	{
//       return res.status(400).send('Токен нето');
// 	}
// });

app.get('/gameChars', (req, res) => {
	// const playersTokens = gameChars.players.map(player => player.token);
	// const readyPlayersTokens = gameChars.readyPlayers.map(player => player.token);
    res.json({
    success: true,
    message: 'Все классно обработано все ок!',
    characters: gameChars.characters,
    players: gameChars.players,
    readyPlayers: gameChars.readyPlayers,
    participants: participants
    });
  });

app.post('/chars', upload.none(), (req, res) => {
  if (req.body.token) {
    const usersPath = path.join(`${PARTOFPATH}users.json`);
    const usersRaw = fs.readFileSync(usersPath, 'utf8');
    const usersJson = JSON.parse(usersRaw);

    const user = usersJson.users.find(u => u.token === req.body.token);
    if (!user) {
			return res.status(400).json({ success: false, message: 'Токен нето' });
    }

    console.log(user);

    const charsPath = path.join(`${PARTOFPATH}chars.json`);
    const charsRaw = fs.readFileSync(charsPath, 'utf8');
    const charsJson = JSON.parse(charsRaw);

    const charsOfOwner = charsJson.runners.filter(c => c.owner === user.token);
    console.log(charsOfOwner);
    // res.json(charsOfOwner);

    res.json({
    success: true,
    message: 'Все классно обработано все ок!',
    data: charsOfOwner,
    });

  } else {
			return res.status(400).json({ success: false, message: 'Токен нето' });
  }
});

app.get('/allChars', (req, res) => {
		res.sendFile(path.join(__dirname, 'chars.json'));
});

app.post('/token', upload.none(), (req, res) => {
	if(req.body.token)
	{
		res.json({
    success: true,
    message: 'Все классно обработано все ок!',
    token: req.body.token,
    });
	}
	else {
			return res.status(200).json({ success: false, message: 'Токен нето' });
  }

});

app.post('/offlineToken', upload.none(), (req, res) => {
	if(req.body.token)
	{
		res.json({
    success: true,
    message: 'Все классно обработано все ок!',
    token: req.body.token,
    });
	}
	else {
			return res.status(200).json({ success: false, message: 'Токен нето' });
  }
});

app.post('/topToken', upload.none(), (req, res) => {

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
  	if (req.body.token) {
    const usersPath = path.join(`${PARTOFPATH}users.json`);
    const usersRaw = fs.readFileSync(usersPath, 'utf8');
    const usersJson = JSON.parse(usersRaw);

    const user = usersJson.users.find(u => u.token === req.body.token);
    if (!user) {
			return res.status(400).json({ success: false, message: 'Токен нето' });
    }

    if (!req.body.url) {
      return res.status(400).send('Картинка не была загружена');
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
    aiResult.speed = parseInt(aiResponse.data.text_blocks?.[0]?.code?.speed || aiResponse.data.text_blocks?.[0]?.snippet?.speed, 10);
    console.log(aiResponse.data);
    console.log(aiResult);
    if(aiResult === undefined)
    {
    	aiResult = JSON.stringify({
      "id": 0,
      "name": "Толстяк",
      "color": "#A0522D",
      "speed": 12,
    	"url": "https://st.depositphotos.com/1026550/3824/i/450/depositphotos_38245069-stock-photo-funny-overweight-sports-man.jpg",
    	"owner": user.token});
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
		  url: imageUrl,
		  owner: user.token
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

  }} catch (error) {
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

    const filePath = path.join(`${PARTOFPATH}chars.json`);
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

app.post('/login', upload.none(), async (req, res) => {
	try {

	if(!req.body.token){
      return res.status(400).send('Вы нето ввели!!!');
    }

    const token = req.body.token;

    const filePath = path.join(`${PARTOFPATH}users.json`);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(rawData);
    
    const user = json.users.find(u => u.token === token);
    if(user)
    {
    		res.status(200).json({ success: true, username: user.username });   

    }
    else
    {
    		res.status(200).json({ success: false });   
    }

    // fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    // res.status(200).send(`Персонаж "${name}" успешно удалён`);    
  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).send('Ошибка при входе чето');
  }
});

app.post('/getUsernameByToken', upload.none(), async (req, res) =>
{
	if(!req.body.token){
      return res.status(400).send('Вы нето ввели!!!');
    }

    const token = req.body.token;

    const filePath = path.join(`${PARTOFPATH}users.json`);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(rawData);
    
    const user = json.users.find(u => u.token === token);
    if(user)
    {
    		res.status(200).json({ success: true,  username: user.username });   

    }
    else
    {
    		res.status(200).json({ success: false });   
    }
});

app.post('/signup', upload.none(), async (req, res) => {
  try {
		if(!req.body.username || !req.body.password){
      return res.status(400).send('Вы нето ввели!!!');
    }

    const username = req.body.username;
    const password = req.body.password;

    const filePath = path.join(`${PARTOFPATH}users.json`);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(rawData);
    
    const user = json.users.find(u => u.username === username);

    if(user)
    {
    	  return res.status(400).json({ success: false });
    }
    else
    {
    		const newChuvak = {
				  username: username,
				  password: password,
				  token: hs256(username+password, secret)
				};
				json.users.push(newChuvak);
				fs.writeFileSync(`${PARTOFPATH}users.json`, JSON.stringify(json, null, 2), 'utf8');
    		return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('Ошибка обработки URL:', error);
    res.status(500).send('Ошибка при обработке изображения или генерации данных');
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

// app.listen(port, (err) => {
//     if (err) {
//         return console.log('Error: ', err);
//     }
//     console.log(`Express server is listening on ${port}`);
// });
