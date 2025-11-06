//const { createElement } = require("react");
// const crypto = require('crypto');
const container = document.getElementById('container');
const buttonInv = document.getElementById('ButtonInv');
buttonInv.classList.add('ButtonInv');
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

// function hs256(message, secret) {
//   const hmac = crypto.createHmac('sha256', secret);
//   hmac.update(message);
//   const signature = hmac.digest('base64');
//   return signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
// }

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

container.addEventListener('click', function(event) {
    function slowDownCharacter(charElement) {
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
                    <input type="password" id="signupConfirmPassword" class="auth-input" placeholder="Повторите пароль">
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
            const formData = new FormData();
            formData.append("username", username);
            formData.append("password", password);
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
                    hs256(username + password, secret).then(token => {
                    currentUserToken = token;
                    console.log(currentUserToken);

                    //formData
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
                    });

                    // const response = await fetch('/chars');
                    // if (!response.ok) throw new Error('Ошибка загрузки');
                    // charData = await response.json();


                } else {
                    errorDiv.textContent = data.message || 'Ошибка входа';
                }
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
            
            // if (password !== confirmPassword) {
            //     errorDiv.textContent = 'Пароли не совпадают';
            //     return;
            // }
            
            // if (password.length < 4) {
            //     errorDiv.textContent = 'Пароль должен быть не менее 4 символов';
            //     return;
            // }

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

window.addEventListener('DOMContentLoaded', async () => {
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

buttonInv.addEventListener('click', function()
{
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
            buttonReset.disabled = true;
            buttonStart.disabled = true;
        }
    const newDiv = document.createElement('div');
    newDiv.classList.add('inventoryMenu');
    newDiv.id = 'menuDiv';
    document.body.appendChild(newDiv);

    for(let i = 1; i < charData.length+1; i++)
    {
        const newMDiv = document.createElement('div');
        newMDiv.classList.add('characterInMenu');
        newMDiv.id = `char${i}`;
        newDiv.appendChild(newMDiv);
        const vak4 = charData.find(c => c.id === i);
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
        killButton.id = `killButton${i}`;
        newMDiv.appendChild(killButton);

         const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');

        const addButton = document.createElement('button');
        addButton.textContent = 'Добавить';
        addButton.classList.add('addButton');
        buttonContainer.appendChild(addButton);
        addButton.id = `addButton${i}`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.classList.add('deleteButton');
        buttonContainer.appendChild(deleteButton);
        deleteButton.id = `deleteButton${i}`;

        newMDiv.appendChild(buttonContainer);

        addButton.addEventListener('click', function()
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
            if(!document.getElementById(`track${i}`))
            {
                const newDiv = document.createElement('div');
                newDiv.classList.add('track');
                newDiv.id = `track${i}`;
                container.appendChild(newDiv);

                const newDiv2 = document.createElement('div');
                newDiv2.dataset.name = vak4.name; 
                newDiv2.classList.add('charOnTrack');
                newDiv2.id = `char1${i}`;
                newDiv2.style = `background: url('${vak4.url}');background-size: cover; background-repeat: no-repeat;`;
                newDiv2.dataset.characterId = i;
                newDiv2.dataset.speed = vak4.speed;
                newDiv2.dataset.position = "0";
                newDiv2.dataset.slowed = "false"; 
                newDiv.appendChild(newDiv2);

                const newP = document.createElement('p');
                newP.classList.add('charTextOnTrack');
                newP.id = `charText${i}`;
                newP.textContent = vak4.name;
                newDiv.appendChild(newP);

                finishLine.classList.add('visible');
                finishLine.style.right = '130px';

            }
        })

        killButton.addEventListener('click', function() {
            
            const formData = new FormData();
            formData.append('charName', document.getElementById(`char${i}`).querySelector('img').alt);
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

            [`char${i}`, `track${i}`, `charText${i}`].forEach(id => 
                document.getElementById(id)?.remove()
            );
            const remainingTracks = container.getElementsByClassName('track').length;
            if (remainingTracks === 0) {
                finishLine.classList.remove('visible');
                }
            alert(`ТЫ УБИЛ ${document.getElementById(`char${i}`).querySelector('img').alt}`);
            });
            deleteButton.addEventListener('click', function()
            {
                if(document.getElementById(`track${i}`))
                {
                    const div = document.getElementById('container');
                    div.removeChild(document.getElementById(`track${i}`));
                }
                const remainingTracks = container.getElementsByClassName('track').length;
            if (remainingTracks === 0) {
                finishLine.classList.remove('visible');
            }
            })
    }
    }

    const generateButton = document.createElement('button');
    generateButton.textContent = 'Сгенерировать';
    generateButton.classList.add('generateButton');
    newDiv.appendChild(generateButton);
    generateButton.id = 'generateButton'

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
        buttonReset.disabled = false;
        buttonStart.disabled = false;

    })

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
            fetch('/img', {
              method: 'POST',
              body: formData
            })
            .then(response => response.json())
            .then(data => {
              console.log('Файл успешно загружен:', data);
              urlInput.style.display = 'none';
            })
            .catch(error => {
              console.error('Ошибка загрузки файла:', error);
            });
        }
    }
});

});


buttonInv.addEventListener('click', function()
{
    if(container.innerHTML)
    {
        for(let i = 0; i < charData.length+1; i++)
        {
            let char = document.getElementById(`track${i}`); 
            // char.position = 500px;
        }
    }
});


buttonReset.addEventListener('click', function()
{
    if (isMenuOpened || raceInProgress) { 
        return;
    }
    
    const tracks = container.getElementsByClassName('charOnTrack');
    for (let track of tracks) {
        track.dataset.position = "0";
        track.style.transform = 'translateX(0px)';
    }
    
 
    const resultsDiv = document.getElementById('results');
    const firstChild = resultsDiv.firstElementChild;
    resultsDiv.innerHTML = '';    

    // finishLine.classList.remove('visible');
    allFinished = false;
})

let raceStartTime = 0;

buttonStart.addEventListener('click', function() {
    if (raceInProgress) {
        return;
    }

    const tracks = document.getElementsByClassName('charOnTrack');
    if (tracks.length === 0) {
        alert("Добавьте хотя бы одного персонажа на трек!");
        return;
    }

    finishLine.classList.add('visible');
    finishLine.style.right = '130px';

    raceInProgress = true;
    allFinished = false;
    buttonStart.disabled = true;
    buttonInv.disabled = true;
    buttonReset.disabled = true;


    const finishLinePosition = container.offsetWidth - 200;
    const startTime = Date.now();
    const finishTimes = []; 
    let finishedCount = 0; 
    const totalTracks = tracks.length;
     for (let track of tracks) {
        track.dataset.finished = 'false';
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

    let allFinishedNow = false;

    for (let track of tracks) {
        if (track.dataset.finished === 'true') continue;

        let currentPosition = parseFloat(track.dataset.position);
        let speed = parseInt(track.dataset.speed) / 10;

        if (currentPosition < finishLinePosition) {
            currentPosition += getVisualSpeed(speed);

            if (currentPosition >= finishLinePosition) {
                currentPosition = finishLinePosition; 
                track.dataset.finished = 'true';
                finishedCount++;

                const finishTime = Date.now();
                track.dataset.finishTime = finishTime;
                finishTimes.push({
                    element: track,
                    finishTime: finishTime,
                    characterId: parseInt(track.dataset.characterId)
                });

                console.log(`Финиш! ${track.dataset.name}: ${(finishTime - startTime)}ms`);
            }

            track.dataset.position = currentPosition;
            track.style.transform = `translateX(${currentPosition}px)`;

            const charText = document.getElementById(`charText${track.dataset.characterId}`);
                if (charText) {
                    const realSpeed = parseInt(track.dataset.speed);
                    const visualSpeed = getVisualSpeed(realSpeed);
                    const character = charData.find(c => c.id === parseInt(track.dataset.characterId));
                    charText.textContent = `${character.name} (Скорость: ${visualSpeed})`;
                }
        }
    }


    allFinishedNow = (finishedCount == totalTracks);

    if (allFinishedNow) {
        raceInProgress = false;
        allFinished = true; 
        buttonStart.disabled = false;
        buttonInv.disabled = false;
        buttonReset.disabled = false; 
        animationId = null;

        for(let track of tracks)
        {
            const charText = document.getElementById(`charText${track.dataset.characterId}`);
            const character = charData.find(c => c.id === parseInt(track.dataset.characterId));
            charText.textContent = `${character.name}`;
        }

        finishTimes.sort((a, b) => a.finishTime - b.finishTime);
        const resultsDiv = document.getElementById('results');
        let resultsHTML = '';

        finishTimes.slice(0, 3).forEach((finisher, index) => {
            const character = charData.find(c => c.id === finisher.characterId);
            if (character) {
                const rawTime = finisher.finishTime - startTime;
                const time = (rawTime / 1000).toFixed(2);

                console.log(`Результат ${character.name}: ${rawTime}ms = ${time}сек`);

                const place = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                resultsHTML += `
                    <div class="result-item">
                        <div class="user-avatar" style="background: url('${character.url}'); background-size: cover; background-repeat: no-repeat;">
                            <div class="avatar-img" style="display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 12px;">${place}</div>
                        </div>
                        <div class="result-info">
                            <div class="result-name">${character.name}</div>
                            <div class="result-time">Время: ${time} сек.</div>
                        </div>
                    </div>`;
            }
        });

        resultsDiv.innerHTML = resultsHTML;

        for (let track of tracks) {
            track.dataset.finishTime = '';
        }
    } else {
        animationId = requestAnimationFrame(moveTracks);
    }
}

    moveTracks();
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


const finishLine = document.createElement('div');
finishLine.classList.add('finish-line');
finishLine.id = 'globalFinishLine';
container.appendChild(finishLine);
container.style.position = 'relative';


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
        document.body.removeChild(exitContainer);
        document.body.removeChild(shadowing);
        showAuthModal();
    });
    
    document.getElementById('cancelExit').addEventListener('click', function() {
        document.body.removeChild(exitContainer);
        document.body.removeChild(shadowing);
    });
});

