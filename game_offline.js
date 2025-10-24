const container = document.getElementById('container');
const buttonInv = document.getElementById('ButtonInv');
const buttonStart = document.getElementById('ButtonStart');
const buttonReset = document.getElementById('ButtonReset');
let raceInProgress = false;
let isMenuOpened = false;
let animationId = null;
let clickCooldown = false;
const slowDownDuration = 1000; // 1 секунда замедления
const clickDelay = 2000; // 2 сек. делэя

let charData;

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
        
        const track = charElement.closest('.track');
        if (track) {
            const oldMessage = document.getElementById(newP1.id);
            if (oldMessage) {
                oldMessage.remove();
            }
            track.appendChild(newP1);
        }
        
        console.log(`Замедление: ${originalSpeed} -> ${slowedSpeed}`);
        
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



window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/chars');
    if (!response.ok) throw new Error('Ошибка загрузки');

    charData = await response.json();
  } catch (err) {
    console.error(err);
  }
});

buttonInv.addEventListener('click', function()
{
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

    for(let i = 1; i < charData.runners.length+1; i++)
    {
        const newMDiv = document.createElement('div');
        newMDiv.classList.add('characterInMenu');
        newMDiv.id = `char${i}`;
        newDiv.appendChild(newMDiv);
        const vak4 = charData.runners.find(c => c.id === i);
        if(vak4){
       newMDiv.innerHTML = '';
        
        const charImage = document.createElement('img');
        charImage.src = vak4.url; 
        charImage.alt = vak4.name;
        charImage.style.width = '200px';
        charImage.style.height = '200px';
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
            
            alert(`ТЫ УБИЛ ${document.getElementById(`char${i}`).querySelector('img').alt}`);
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
        for(let i = 0; i < charData.runners.length+1; i++)
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

    finishLine.classList.remove('visible');
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
    buttonStart.disabled = true;
    buttonInv.disabled = true;
    buttonReset.disabled = true; 
    
    const finishLinePosition = container.offsetWidth - 200;
    const startTime = Date.now();
    const finishTimes = []; 
    
    function moveTracks() {
        if (!raceInProgress) return;
        
        let allFinished = true;

        for (let track of tracks) {
            let currentPosition = parseFloat(track.dataset.position);
            let speed = parseInt(track.dataset.speed) / 12;
            
            if (currentPosition < finishLinePosition + 15) {
                currentPosition += speed;
                track.dataset.position = currentPosition;
                track.style.transform = `translateX(${currentPosition}px)`;
                allFinished = false;
            } else {
                if (!track.dataset.finishTime) {
                    const finishTime = Date.now();
                    track.dataset.finishTime = finishTime;
                    finishTimes.push({
                        element: track,
                        finishTime: finishTime,
                        characterId: parseInt(track.dataset.characterId)
                    });
                }
            }
        }
            
        if (allFinished) {
            raceInProgress = false;
            buttonStart.disabled = false;
            buttonInv.disabled = false;
            buttonReset.disabled = false; 
            animationId = null;
            
            finishTimes.sort((a, b) => a.finishTime - b.finishTime);
            
            const resultsDiv = document.getElementById('results');
            let resultsHTML = '';
            
            finishTimes.forEach((finisher, index) => {
                const character = charData.runners.find(c => c.id === finisher.characterId);
                if (character) {
                    const place = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1} место`;
                    const time = ((finisher.finishTime - startTime) / 1000).toFixed(2);
                    
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
document.body.appendChild(userPanel);

const topPanel = document.querySelector('.topPanel');
topPanel.appendChild(userPanel);


/// тут линия финиша


const finishLine = document.createElement('div');
finishLine.classList.add('finish-line');
finishLine.id = 'globalFinishLine';
container.appendChild(finishLine);
container.style.position = 'relative';

