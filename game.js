//const { createElement } = require("react");
// const crypto = require('crypto');
const container = document.getElementById('container');
const buttonInv = document.getElementById('ButtonInv');
const buttonStart = document.getElementById('ButtonStart');
const buttonReset = document.getElementById('ButtonReset');
let raceInProgress = false;
let isMenuOpened = false;
let animationId = null;
let clickCooldown = false;
let allFinished = false;
const slowDownDuration = 1000; // 1 секунда замедления
const clickDelay = 2000; // 2 сек. делэя
let lastSpeedUpdateTime = 0;
const speedUpdateInterval = 3000; // Обновлять скорость раз в 2 секунды
let currentVisualSpeeds = {};
let isFirstClick = true;
let blinkInterval;
let currentUserToken = ""; 
const secret = "52";

let charData;

const gameChars = {
  characters: [],
  players: [],
  readyPlayers: []
};

const finishLine = document.createElement('div');
finishLine.classList.add('finish-line');
finishLine.id = 'globalFinishLine';
container.appendChild(finishLine);
container.style.position = 'relative';

let participants = []; // массив объектов: { token, name, speed, position, finished }

const socket = new WebSocket('ws://localhost:3000');

let lastPositions = {};

function animateToPosition(el, from, to) {
  const duration = 100; // мс
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const current = from + (to - from) * progress;
    el.style.transform = `translateX(${current}px)`;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

socket.onmessage = (event) => {
  syncChars()
  const data = JSON.parse(event.data);
  if (data.type === 'characterAdded') {
    if (!gameChars.players.includes(data.character.owner)) {
        gameChars.players.push(data.character.owner);
      }

      participants.push({
        token: data.character.owner,
        name: data.character.name,
        speed: data.character.speed,
        position: 0,
        finished: false,
        url: data.character.url
      });
    // gameChars.players.push(data.userToken);
    // addCharacterToTrack(data.character);
  }
  if (data.type === 'characterDeleted')
  {
    syncChars();
    gameChars.characters = gameChars.characters.filter(char => char.name !== data.character.name); 
    gameChars.players = gameChars.players.filter(char => char.token !== data.userToken);   
    gameChars.readyPlayers = gameChars.readyPlayers.filter(char => char.token !== data.userToken);     
    deleteCharacterFromTrack(data.character);
  }
  if (data.type === 'startRace')
  {
    console.log('началось');

    // startRace();
  }
  if (data.type === 'raceUpdate') {
    syncChars();
    data.positions.forEach(p => {
      const el =  document.getElementById(`char1${p.name}`);
      if (!el) return;

      const from = lastPositions[p.token] ?? 0;
      const to = p.position;

      animateToPosition(el, from, to);
      lastPositions[p.token] = to;
    });
  }

  if (data.type === 'raceFinished') {
    syncChars();
    showResults(data.results);
  }
};

function showResults(results) {
  const resultsDiv = document.getElementById('results');
  let resultsHTML = '';

  results.slice(0, 3).forEach((finisher, index) => {
    const time = (finisher.finishTime / 1000).toFixed(2); // уже готовое значение
    const place = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';

    resultsHTML += `
      <div class="result-item">
        <div class="user-avatar" style="background: url('${finisher.url}'); background-size: cover;">
          <div class="avatar-img" style="display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 12px;">${place}</div>
        </div>
        <div class="result-info">
          <div class="result-name">${finisher.name}</div>
          <div class="result-time">Время: ${time} сек.</div>
        </div>
      </div>`;
  });

  resultsDiv.innerHTML = resultsHTML;
}


async function hs256(message, secret) {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const msgData = enc.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);

  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return base64;
}

function startRace() {
  if (raceInProgress) {
    console.log('Гонка уже идёт');
    return;
  }

  const tracks = document.getElementsByClassName('charOnTrack');
  if (tracks.length === 0) {
    alert("Добавьте хотя бы одного персонажа на трек!");
    return;
  }

  // Инициализация гонки
  raceInProgress = true;
  allFinished = false;
  buttonStart.disabled = true;
  buttonInv.disabled = true;
  buttonReset.disabled = true;

  finishLine.classList.add('visible');
  finishLine.style.right = '130px';

  const finishLinePosition = container.offsetWidth - 200;
  const startTime = Date.now();
  const finishTimes = [];
  let finishedCount = 0;
  const totalTracks = tracks.length;
  const currentVisualSpeeds = {};

  // Инициализация треков
  for (let track of tracks) {
    track.dataset.finished = 'false';
    track.dataset.position = 0; // тут убрал ||
    track.dataset.speed = parseInt(track.dataset.speed) || 10;
    console.log(track.dataset);
  }

  function getVisualSpeed(realSpeed) {
    if (Math.random() < 0.7 && currentVisualSpeeds[realSpeed]) {
      return currentVisualSpeeds[realSpeed];
    }
    const randomChange = Math.floor(Math.random() * 3) + 1;
    const visualSpeed = Math.max(1, realSpeed + randomChange);
    currentVisualSpeeds[realSpeed] = visualSpeed;
    return visualSpeed;
  }

  function moveTracks() {
    if (!raceInProgress) return;

    for (let track of tracks) {
      if (track.dataset.finished === 'true') continue;

      let currentPosition = parseFloat(track.dataset.position);
      let speed = parseInt(track.dataset.speed) / 10;
      const visualSpeed = getVisualSpeed(speed);

      currentPosition += visualSpeed;

      if (currentPosition >= finishLinePosition) {
        currentPosition = finishLinePosition;
        track.dataset.finished = 'true';
        finishedCount++;

        const finishTime = Date.now();
        track.dataset.finishTime = finishTime;
        finishTimes.push({
          element: track,
          finishTime,
          characterId: parseInt(track.dataset.characterId),
          name: track.dataset.name,
          url: track.dataset.url// тут url не работает вроде
        });

        console.log(`Финиш: ${track.dataset.name} — ${(finishTime - startTime)}ms`);
      }

      track.dataset.position = currentPosition;
      track.style.transform = `translateX(${currentPosition}px)`;

      const charText = document.getElementById(`charText${track.dataset.characterId}`);
      if (charText) {
        charText.textContent = `${track.dataset.name} (Скорость: ${visualSpeed})`;
      }
    }

    if (finishedCount === totalTracks) {
      console.log('raceend');
      raceInProgress = false;
      allFinished = true;
      buttonStart.disabled = false;
      buttonInv.disabled = false;
      buttonReset.disabled = false;

      // cancelAnimationFrame(animationId);
      animationId = null;

      for (let track of tracks) {
        const charText = document.getElementById(`charText${track.dataset.characterId}`);
        if (charText) {
          charText.textContent = `${track.dataset.name}`;
        }
        track.dataset.finishTime = '';
      }

      showResults(finishTimes, startTime);
      console.log('pocazal');
    } else {
      animationId = requestAnimationFrame(moveTracks);
      console.log('reqanim');
    }
  }

  function showResults(finishTimes, startTime) {
    finishTimes.sort((a, b) => a.finishTime - b.finishTime);
    const resultsDiv = document.getElementById('results');
    let resultsHTML = '';

    finishTimes.slice(0, 3).forEach((finisher, index) => {
      const time = ((finisher.finishTime - startTime) / 1000).toFixed(2);
      const place = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';

      resultsHTML += `
        <div class="result-item">
          <div class="user-avatar" style="background: url('${finisher.url}'); background-size: cover;">
            <div class="avatar-img" style="display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 12px;">${place}</div>
          </div>
          <div class="result-info">
            <div class="result-name">${finisher.name}</div>
            <div class="result-time">Время: ${time} сек.</div>
          </div>
        </div>`;
    });

    resultsDiv.innerHTML = resultsHTML;
  }

  animationId = requestAnimationFrame(moveTracks);
}



function addCharacterToTrack(vak4)
{

    if(allFinished == true)
            {
                const tracks = container.getElementsByClassName('charOnTrack');
                for (let track of tracks) {
                    track.dataset.position = "0";
                    track.dataset.finished = "false"; 
                    track.style.transform = 'translateX(0px)';
                }


                const resultsDiv = document.getElementById('results');
                const firstChild = resultsDiv.firstElementChild;
                resultsDiv.innerHTML = '';    

             //   finishLine.classList.remove('visible');
                allFinished = false;
            }

                function removeDefaultRacer() {
                const defaultTrack = document.getElementById('track0');
                const defaultChar = document.getElementById('char0');
                const defaultText = document.getElementById('charText0');

                if (defaultTrack) {
                    defaultTrack.remove();
                }
                if (defaultChar) {
                    defaultChar.remove();
                }
                if (defaultText) {
                    defaultText.remove();
                }

                raceInProgress = false;
                allFinished = false;
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
                removeDefaultRacer();
            if(!document.getElementById(`track${vak4.name}`))//track{i} на track{vak4.name}
            {
                const newDiv = document.createElement('div');
                newDiv.classList.add('track');
                newDiv.id = `track${vak4.name}`;
                container.appendChild(newDiv);

                const newDiv2 = document.createElement('div');
                newDiv2.dataset.name = vak4.name; 
                newDiv2.classList.add('charOnTrack');
                newDiv2.id = `char1${vak4.name}`;
                newDiv2.style = `background: url('${vak4.url}');background-size: cover; background-repeat: no-repeat;`;
                newDiv2.dataset.characterId = vak4.name;
                newDiv2.dataset.speed = vak4.speed;
                newDiv2.dataset.position = "0";
                newDiv2.dataset.slowed = "false"; 
                newDiv2.dataset.url = vak4.url;
                newDiv.appendChild(newDiv2);

                const newP = document.createElement('p');
                newP.classList.add('charTextOnTrack');
                newP.id = `charText${vak4.name}`;
                newP.textContent = vak4.name;
                newDiv.appendChild(newP);

                finishLine.classList.add('visible');
                finishLine.style.right = '130px';

            }

}

function deleteCharacterFromTrack(vak4)
{
    if(document.getElementById(`track${vak4.name}`))
    {
        const div = document.getElementById('container');
        div.removeChild(document.getElementById(`track${vak4.name}`));
    }
    const remainingTracks = container.getElementsByClassName('track').length;

    if (remainingTracks === 0) {
        finishLine.classList.remove('visible');
    }
}

container.addEventListener('click', function(event) {
    function slowDownCharacter(charElement) { // тут перенести в онлайн и переделать под запрос

        const originalSpeed = parseInt(charElement.dataset.speed);
        const slowedSpeed = Math.floor(originalSpeed * 0.7);
        
        charElement.dataset.speed = slowedSpeed;
        charElement.dataset.slowed = 'true';
        
        const newP1 = document.createElement('p');
        newP1.classList.add('charTextOnTrackSlowed');
        newP1.id = `charTextSlowed${charElement.dataset.characterId}`;
        newP1.textContent = `Игрок: Замедлил ${charElement.dataset.name}-а на ${slowDownDuration/1000} сек.`;
        
        const charPosition = parseFloat(charElement.dataset.position);
        newP1.style.setProperty('--char-position', `${charPosition}px`);

        const track = charElement.closest('.track');
        if (track) {
            const oldMessage = document.getElementById(newP1.id);
            if (oldMessage) {
                oldMessage.remove();
            }
            track.appendChild(newP1);
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

    if (!raceInProgress || clickCooldown) return;
    
    const charElement = event.target.closest('.charOnTrack');
    if (!charElement) return;
    
    if (charElement.dataset.slowed === 'true') return;
    
    clickCooldown = true;
    
    slowDownCharacter(charElement);
    
    charElement.style.filter = 'brightness(0.7)';
    charElement.style.boxShadow = '0 0 10px red';
    
    setTimeout(() => {
        charElement.style.filter = 'brightness(1)';
        charElement.style.boxShadow = 'none';
    }, slowDownDuration);
    
    setTimeout(() => {
        clickCooldown = false;
    }, clickDelay);
});

function showAuthModal() {
        if(currentUserToken)
        {
            return;
        }
        const shadowing = document.createElement('div');
        shadowing.classList.add('shadowing');
        shadowing.id = 'authShadowing';
        
        const authContainer = document.createElement('div');
        authContainer.classList.add('authContainer');
        authContainer.id = 'authContainer';
        
        authContainer.innerHTML = `
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="login">Вход</button>
                <button class="auth-tab" data-tab="signup">Регистрация</button>
            </div>
            
            <div class="auth-content">
                <div id="loginForm" class="auth-form active">
                    <h3>Авторизация</h3>
                    <input type="text" id="loginUsername" class="auth-input" placeholder="Логин">
                    <input type="password" id="loginPassword" class="auth-input" placeholder="Пароль">
                    <button id="loginSubmit" class="auth-submit">Войти</button>
                    <div id="loginError" class="auth-error"></div>
                </div>
                
                <div id="signupForm" class="auth-form">
                    <h3>Регистрация</h3>
                    <input type="text" id="signupUsername" class="auth-input" placeholder="Логин">
                    <input type="password" id="signupPassword" class="auth-input" placeholder="Пароль">
                    <button id="signupSubmit" class="auth-submit">Зарегистрироваться</button>
                    <div id="signupError" class="auth-error"></div>
                </div>
            </div>
            
            <button id="authSkip" class="auth-skip">Пропустить</button>
        `;
        
        document.body.appendChild(shadowing);
        document.body.appendChild(authContainer);
        
        const tabs = authContainer.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                
                tabs.forEach(t => t.classList.remove('active'));
                authContainer.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                
                this.classList.add('active');
                document.getElementById(tabName + 'Form').classList.add('active');
            });
        });
        
        document.getElementById('loginSubmit').addEventListener('click', function() {
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            const errorDiv = document.getElementById('loginError');
            
            if (!username || !password) {
                errorDiv.textContent = 'Заполните все поля';
                return;
            }
            hs256(username + password, secret).then(token => {
            currentUserToken = token;
            localStorage.setItem('token', currentUserToken);
            const formData = new FormData();
            formData.append("token", currentUserToken);
            fetch('/login', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    closeAuthModal();
                    if (document.querySelector('.user-name')) {
                        document.querySelector('.user-name').textContent = username;
                    }
                    // currentUserToken = await hs256(username+password, secret);
                    const formData = new FormData();
                    formData.append('token', currentUserToken);
                    fetch('/chars', {
                      method: 'POST',
                      body: formData
                    }).then(response => response.json())
            .       then(data => {
                    if (data.success) {
                        charData = data.data;
                        // charData.sort((a, b) => a.id - b.id);
                        charData.forEach((char, index) => {
                          char.id = index + 1;
                        });
                        errorDiv.textContent = 'Все ок.';
                    } else {
                        errorDiv.textContent = data.message || 'Ошибка получения бойцов';
                    }
            })
            .catch(error => {
                console.log(error);
                errorDiv.textContent = 'Ошибка соединения';
            });
                    }});
            })
            .catch(error => {
                errorDiv.textContent = 'Ошибка соединения';
            });
        });
        
        document.getElementById('signupSubmit').addEventListener('click', function() {
            const username = document.getElementById('signupUsername').value.trim();
            const password = document.getElementById('signupPassword').value.trim();
            // const confirmPassword = document.getElementById('signupConfirmPassword').value.trim();
            const errorDiv = document.getElementById('signupError');
            
            if (!username || !password) {
                errorDiv.textContent = 'Заполните все поля';
                return;
            }

            const formData = new FormData();
            formData.append("username", username);
            formData.append("password", password); 
            fetch('/signup', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    errorDiv.textContent = 'Регистрация успешна! Теперь войдите.';
                    tabs[0].click();
                } else {
                    errorDiv.textContent = data.message || 'Ошибка регистрации';
                }
            })
            .catch(error => {
                console.log(error);
                errorDiv.textContent = 'Ошибка соединения';
            });
        });
        
        document.getElementById('authSkip').addEventListener('click', function() {
            closeAuthModal();
        });
        
        function closeAuthModal() {
            document.body.removeChild(shadowing);
            document.body.removeChild(authContainer);
        }
    }

function syncChars(){
    fetch('/gameChars', {
    method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if(gameChars.characters != data.characters)
            {
                gameChars.characters = data.characters;
                for(char of gameChars.characters)
                {
                    addCharacterToTrack(char);
                }
            }
            if(gameChars.players != data.players)
            {
                gameChars.players = data.players;
            }
            if(gameChars.readyPlayers != data.readyPlayers)
            {
                gameChars.readyPlayers = data.readyPlayers;
                // for(player of gameChars.readyPlayers) тут типа менять цвет или както обозначать что чел готов на треке
                // {
                // }
            }
            console.log(gameChars)
        } else {
           console.log(data.message || 'Ошибка синхронизации онлайна');
        }
    })
    .catch(error => {
        console.log(error);
    });
}

window.addEventListener('DOMContentLoaded', async () => {
currentUserToken = localStorage.getItem('token');
console.log(currentUserToken);
syncChars();

function enableAttentionEffect() {
    if (isFirstClick) {
        buttonInv.classList.add('attention');
    }
}

function createDefaultRacer() {

    const defaultRunner =  
    {
      "id": 0,
      "name": "Default runner",
      "color": "#FF7B6B",
      "speed": 15,
      "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1sk_eXgKrVebI7H_1NMwLb8YAasI1s8FDdQ&s"
    }

    const trackDiv = document.createElement('div');
    trackDiv.classList.add('track');
    trackDiv.id = 'track0';
    container.appendChild(trackDiv);

    const charDiv = document.createElement('div');
    charDiv.dataset.name = defaultRunner.name;
    charDiv.classList.add('charOnTrack');
    charDiv.id = 'char0';
    charDiv.style = `background: url('${defaultRunner.url}'); background-size: cover; background-repeat: no-repeat;`;
    charDiv.dataset.characterId = "0";
    charDiv.dataset.speed = defaultRunner.speed;
    charDiv.dataset.position = "0";
    charDiv.dataset.slowed = "false";
    trackDiv.appendChild(charDiv);

    const nameP = document.createElement('p');
    nameP.classList.add('charTextOnTrack');
    nameP.id = 'charText0';
    nameP.textContent = defaultRunner.name;
    trackDiv.appendChild(nameP);

    finishLine.classList.add('visible');
    finishLine.style.right = '130px';

    return defaultRunner;
}

function startAutoRace() {
    if (raceInProgress) return;

    const tracks = document.getElementsByClassName('charOnTrack');
    const finishLinePosition = container.offsetWidth - 200;

    raceInProgress = true;
    allFinished = false;

    const startTime = Date.now();
    let finishedCount = 0;
    const totalTracks = tracks.length;

    function autoMoveTracks() {
        if (!raceInProgress) return;

        let allFinishedNow = false;

        for (let track of tracks) {
            if (track.dataset.finished === 'true') continue;

            let currentPosition = parseFloat(track.dataset.position);
            let speed = parseInt(track.dataset.speed) / 10;

            if (currentPosition < finishLinePosition) {
                currentPosition += speed;

                if (currentPosition >= finishLinePosition) {
                    currentPosition = finishLinePosition;
                    track.dataset.finished = 'true';
                    finishedCount++;

                    console.log(`Финиш! ${track.dataset.name}`);
                }

                track.dataset.position = currentPosition;
                track.style.transform = `translateX(${currentPosition}px)`;
            }
        }

        allFinishedNow = (finishedCount === totalTracks);

        if (allFinishedNow) {
            raceInProgress = false;
            allFinished = true;

            setTimeout(() => {
                resetAutoRace();
                startAutoRace(); 
            }, 3000);

        } else {
            animationId = requestAnimationFrame(autoMoveTracks);
        }
    }

    autoMoveTracks();
}

function resetAutoRace() {
    const tracks = container.getElementsByClassName('charOnTrack');
    for (let track of tracks) {
        track.dataset.position = "0";
        track.dataset.finished = "false";
        track.style.transform = 'translateX(0px)';
    }
    allFinished = false;
}

    try {
        // тут запрос при открытии окна!
        showAuthModal();
        createDefaultRacer();
        startAutoRace();
        enableAttentionEffect();

    } catch (err) {
        console.error(err);
        showAuthModal();
        createDefaultRacer();
        startAutoRace();
    }
});

function getInv(charData, newDiv) {
    document.getElementById('generateButton')?.remove();
    const generateButton = document.createElement('button');
    generateButton.textContent = 'Сгенерировать';
    generateButton.classList.add('generateButton');
    newDiv.appendChild(generateButton);
    generateButton.id = 'generateButton';
    const formData = new FormData();
    formData.append('token', currentUserToken);
    fetch('/chars', {
      method: 'POST',
      body: formData
    }).then(response => response.json())
       .then(data => {
    if (data.success) {
        charData = data.data;
        console.log('newchardatafromINV:' + data.data)
        charData.forEach((char, index) => {
          char.id = index + 1;
        });
        const characters = newDiv.querySelectorAll('.characterInMenu');
    characters.forEach(char => char.remove());
  for (let i = 1; i <= charData.length; i++) {
        const vak4 = charData.find(c => c.id === i);
        if (!vak4) continue;
        const newMDiv = document.createElement('div');
        newMDiv.classList.add('characterInMenu');
        newMDiv.id = `char${vak4.name}`;
        newDiv.appendChild(newMDiv);
        if(vak4){
        newMDiv.innerHTML = '';
        const charImage = document.createElement('img');
        charImage.src = vak4.url; 
        charImage.alt = vak4.name;
        charImage.style.width = '224px';
        charImage.style.height = '215px';
        charImage.style.objectFit = 'cover';
        charImage.style.borderRadius = '10px';
        charImage.style.marginBottom = '10px';
    
        const speedText = document.createElement('div');
        speedText.textContent = `Имя БОЙЦА: ${vak4.name}\nСКОРОСТЬ: ${vak4.speed}`;
        speedText.style.marginBottom = '10px';
        
        newMDiv.appendChild(charImage);
        newMDiv.appendChild(speedText);

        const killButton = document.createElement("button");
        killButton.textContent = "X";
        killButton.classList.add('killButton');
        killButton.id = `killButton${vak4.name}`;
        newMDiv.appendChild(killButton);

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');

        const addButton = document.createElement('button');
        addButton.textContent = 'Добавить';
        addButton.classList.add('addButton');
        buttonContainer.appendChild(addButton);
        addButton.id = `addButton${vak4.name}`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.classList.add('deleteButton');
        buttonContainer.appendChild(deleteButton);
        deleteButton.id = `deleteButton${vak4.name}`;  

        newMDiv.appendChild(buttonContainer);

        if(vak4.name == "Default runner")
        {
            addButton.disabled = true;
            deleteButton.disabled = true;    
            killButton.disabled = true;
        }
        if(newDiv.querySelector('#generateButton'))
        {
            const refEl = newDiv.querySelector('#generateButton');
            newDiv.insertBefore(newMDiv, refEl);
        }
        else{
        newDiv.appendChild(newMDiv);
        }

        addButton.addEventListener('click', function()
        {
            socket.send(JSON.stringify({
              type: 'addCharacter',
              character: vak4
            }));
            addCharacterToTrack(vak4);
            syncChars();
        })

        killButton.addEventListener('click', function() {
            
            const formData = new FormData();
            formData.append('charName', document.getElementById(`char${vak4.name}`).querySelector('img').alt);
            fetch('/charDel', {
              method: 'POST',
              body: formData
            })
            .then(response => response.json())
            .then(data => {
              console.log('Удалено:', data);
            })
            .catch(error => {
              console.error('Ошибка удаления:', error);
            });

            [`char${vak4.name}`, `track${vak4.name}`, `charText${vak4.name}`].forEach(id => 
                document.getElementById(id)?.remove()
            );
            const remainingTracks = container.getElementsByClassName('track').length;
            if (remainingTracks === 0) {
                finishLine.classList.remove('visible');
                }
            alert(`ТЫ УБИЛ ${document.getElementById(`char${vak4.name}`).querySelector('img').alt}`);
            syncChars();
            });
            deleteButton.addEventListener('click', function()
            {
                socket.send(JSON.stringify({
                  type: 'deleteCharacter',
                  character: vak4
                }));

                deleteCharacterFromTrack(vak4);
                syncChars();
            });
    }
}


    document.getElementById('urlInput')?.remove();
    } else {
        alert(data.message || 'Ошибка получения бойцов');
    }

    });

}

buttonInv.addEventListener('click', function()
{
    if(!currentUserToken)
    {
        alert("Сначала войдите в аккаунт!");
        return;
    }
    if (isFirstClick) {
        buttonInv.classList.remove('attention');
        if (blinkInterval) {
            clearInterval(blinkInterval);
        }
        isFirstClick = false;
    }
    isMenuOpened = true;
    if(isMenuOpened) 
        {
            buttonInv.disabled = true;
            buttonStart.disabled = true;
        }
    const newDiv = document.createElement('div');
    newDiv.classList.add('inventoryMenu');
    newDiv.id = 'menuDiv';
    document.body.appendChild(newDiv);
    if(!charData.find(c => c.id === 1))
    {
        const defaultRunner =  
        {
          "id": 1,
          "name": "Default runner",
          "color": "#FF7B6B",
          "speed": 15,
          "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1sk_eXgKrVebI7H_1NMwLb8YAasI1s8FDdQ&s"
        }   
        charData[0] = defaultRunner; 
    }
    console.log(charData);
    getInv(charData, newDiv);



    const exitButton = document.createElement('button');
    exitButton.textContent = 'X';
    exitButton.classList.add('exitButton');
    newDiv.appendChild(exitButton);
    exitButton.id = 'exitButton'

    exitButton.addEventListener('click', function()
    {
        const menuDiv = document.getElementById('menuDiv');
        menuDiv.removeChild(exitButton);
        document.body.removeChild(menuDiv);
        isMenuOpened = false;
        buttonInv.disabled = false;
        buttonStart.disabled = false;

    });

generateButton.addEventListener('click', function()
{
    const menuDiv = document.getElementById('menuDiv');
    
    if (!document.getElementById('urlInput')) {
        const urlInput = document.createElement('input');
        urlInput.classList.add('inputImg');
        urlInput.id = 'urlInput';
        urlInput.type = 'url';
        urlInput.placeholder = 'Введите URL изображения...';
        urlInput.style.marginBottom = '10px';
        menuDiv.appendChild(urlInput);
        
        generateButton.textContent = 'Отправить';
        
    } else {
        const urlInput = document.getElementById('urlInput');
        const imageUrl = urlInput.value.trim();
        console.log(imageUrl);
        
        if (!imageUrl) {
            alert('Пожалуйста, введите URL изображения');
            return;
        }
        
        if (imageUrl) {
            const formData = new FormData();
            formData.append('url', imageUrl);
            formData.append('token', currentUserToken);
            fetch('/img', {
              method: 'POST',
              body: formData
            })
            .then(response => response.json())
            .then(data => {
              console.log('Файл:', data);
              urlInput.style.display = 'none';
              document.getElementById('urlInput').remove();
              generateButton.textContent = 'Сгенерировать';
              getInv(charData, newDiv);
              if(data.success&&data.success == false)
              {
                alert(data.message);
              }
            })
            .catch(error => {
              console.error('Ошибка загрузки файла:', error);
            });

        }
    }
});

});

let raceStartTime = 0;

buttonStart.addEventListener('click', function() {
    if(gameChars.readyPlayers.includes(currentUserToken))
    {
        console.log('не тыкайте много хватит!!');
        return;
    }
    else if(!gameChars.players.includes(currentUserToken))
    {
        console.log(gameChars)
        console.log('Cначала добавьте персонажа');
        return;
    }
    else{
        gameChars.readyPlayers.push(currentUserToken);
        console.log(gameChars.readyPlayers);
        socket.send(JSON.stringify({
          type: 'readyToRace',
          token: currentUserToken
        })); 
        syncChars();
    } 
});

//// Тут работа с user

const userPanelContainer = document.createElement('div');
userPanelContainer.className = 'user-panel-container';
const ButtonOut = document.createElement('div');
ButtonOut.className = 'ButtonOut';

const userPanel = document.createElement('div');
userPanel.className = 'user-panel';
userPanel.innerHTML = `
    <div class="user-avatar">
        <img src="opa.jpeg" alt="" class="avatar-img" style="object-fit: cover;width: 100%; height: 100%;">
    </div>
    <div class="user-info">
        <span class="user-name">Игрок</span>
    </div>
`;

const blocker = document.createElement('div');
blocker.className = 'blocker';

userPanelContainer.appendChild(ButtonOut);
userPanelContainer.appendChild(userPanel);
userPanelContainer.appendChild(blocker);
document.body.appendChild(userPanelContainer);

let isAnimating = false;
let isShifted = false;

userPanel.addEventListener('mouseenter', function() {
    if (!isShifted && !isAnimating) {
        isAnimating = true;
        userPanel.classList.remove('returning');
        userPanel.classList.add('shifted');
    }
});

userPanel.addEventListener('transitionend', function(e) {
    if (e.propertyName === 'transform') {
        isAnimating = false;
        
        if (userPanel.classList.contains('shifted')) {
            isShifted = true;   
          setTimeout(() => {
            isAnimating = true;
            userPanel.classList.remove('shifted');
            userPanel.classList.add('returning');
          },3000);
        } else if (userPanel.classList.contains('returning')) {
            isShifted = false;
            blocker.classList.remove('active');
        }
    }
});

userPanel.addEventListener('mouseleave', function() {
});

/// тут линия финиша

window.addEventListener('load', () => {
if (currentUserToken) {
  const formData = new FormData();
  formData.append("token", currentUserToken);
  fetch('/login', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      if (document.querySelector('.user-name')) {
        document.querySelector('.user-name').textContent = data.username;
      }

      const formData = new FormData();
      formData.append('token', currentUserToken);
      fetch('/chars', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          charData = data.data;
          charData.forEach((char, index) => {
            char.id = index + 1;
          });
        } else {
          alert(data.message || 'Ошибка получения бойцов');
        }
      })
      .catch(error => {
        console.log(error);
      });
    }
  });
}
});



// тут кнопка выхода
ButtonOut.addEventListener('click', function() {
    const exitContainer = document.createElement('div');
    exitContainer.classList.add('exitContainer');
    const shadowing = document.createElement('div');
    shadowing.classList.add('shadowing');
    
    exitContainer.innerHTML = `
        <div class="exit-content">
            <h3>Вы действительно хотите выйти?</h3>
            <div class="exit-buttons">
                <button id="confirmExit" class="exit-confirm">Да</button>
                <button id="cancelExit" class="exit-cancel">Нет</button>
            </div>
        </div>
    `;
    document.body.appendChild(shadowing);
    document.body.appendChild(exitContainer);
    
    document.getElementById('confirmExit').addEventListener('click', function() {
        if (document.querySelector('.user-name')) {
            document.querySelector('.user-name').textContent = "Игрок";
        }
        currentUserToken = "";
        localStorage.setItem('token', currentUserToken);
        document.body.removeChild(exitContainer);
        document.body.removeChild(shadowing);
        showAuthModal();
    });
    
    document.getElementById('cancelExit').addEventListener('click', function() {
        document.body.removeChild(exitContainer);
        document.body.removeChild(shadowing);
    });

});

