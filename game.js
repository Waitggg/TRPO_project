const container = document.getElementById('container');
const buttonInv = document.getElementById('ButtonInv');
const buttonStart = document.getElementById('ButtonStart');
const buttonReset = document.getElementById('ButtonReset');
let raceInProgress = false;
let isMenuOpened = false;
let animationId = null;

let charData;

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/chars');
    if (!response.ok) throw new Error('Ошибка загрузки');

    charData = await response.json();
    console.log(charData.runners.find(c => c.id === 1).name);
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
        charImage.style.width = '50px';
        charImage.style.height = '50px';
        charImage.style.objectFit = 'cover';
        charImage.style.borderRadius = '10px';
        charImage.style.marginBottom = '10px';
    
        const speedText = document.createElement('div');
        speedText.textContent = `СКОРОСТЬ: ${vak4.speed}`;
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
                newDiv2.classList.add('charOnTrack');
                newDiv2.id = `char1${i}`;
                newDiv2.dataset.characterId = i;
                newDiv2.dataset.speed = vak4.speed;
                newDiv2.dataset.position = "0";
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
        // try {
        //     new URL(imageUrl);
        // } catch (e) {
        //     alert('Пожалуйста, введите корректный URL');
        //     return;
        // }
        
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

        // fetch('/img', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({ url: imageUrl })
        // })
        // .then(response => response.json())
        // .then(data => {
        //     console.log('URL успешно отправлен:', data);
        //     urlInput.value = '';
        //     generateButton.textContent = 'Сгенерировать';
        //     urlInput.style.display = 'none';
        // })
        // .catch(error => {
        //     console.error('Ошибка отправки URL:', error);
        //     alert('Ошибка при отправке URL');
        // });
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
    resultsDiv.appendChild(firstChild);
    

    finishLine.classList.remove('visible');
})

buttonStart.addEventListener('click', function()
{
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
    
    function moveTracks() {
        if (!raceInProgress) {
            return;
        }
        
        let allFinished = true;
        let maxPosition = 0;
        let winnerTrack = null;

        for (let track of tracks) {
            let currentPosition = parseInt(track.dataset.position);
            let speed = track.dataset.speed / 10;
            
            if (currentPosition < finishLinePosition + 15) {
                currentPosition += speed;
                track.dataset.position = currentPosition.toString();
                track.style.transform = `translateX(${currentPosition}px)`;
                allFinished = false;
            }
            
            if (currentPosition > maxPosition) {
                maxPosition = currentPosition;
                winnerTrack = track;
            }
        }
        
 if (allFinished) {
    raceInProgress = false;
    buttonStart.disabled = false;
    buttonInv.disabled = false;
    buttonReset.disabled = false; 
    animationId = null;
    
    const positions = [];
    for (let track of tracks) {
        const characterId = parseInt(track.dataset.characterId);
        const position = parseInt(track.dataset.position);
        const character = charData.runners.find(c => c.id === characterId);
        const speed1 = character ? character.speed : 0;
        
        positions.push({
            character: character,
            position: position,
            speed1: speed1
        });
    }
    
    positions.sort((a, b) => b.speed1 - a.speed1);
    
    const resultsDiv = document.getElementById('results');
    let resultsHTML = '';
    
    if (positions.length > 0) {
        resultsHTML += `
            <div class="result-item">
                <div class="user-avatar">
                    <div class="avatar-img" style="background: linear-gradient(135deg, #FFD700, #FFA500); display: flex; align-items: center; justify-content: center; font-size: 20px;">🥇</div>
                </div>
                <div class="result-info">
                    <div class="result-name">${positions[0].character.name}</div>
                </div>
            </div>`;
    }
    
    if (positions.length > 1) {
        resultsHTML += `
            <div class="result-item">
                <div class="user-avatar">
                    <div class="avatar-img" style="background: linear-gradient(135deg, #C0C0C0, #A9A9A9); display: flex; align-items: center; justify-content: center; font-size: 20px;">🥈</div>
                </div>
                <div class="result-info">
                    <div class="result-name">${positions[1].character.name}</div>
                </div>
            </div>`;
    }
    
    if (positions.length > 2) {
        resultsHTML += `
            <div class="result-item">
                <div class="user-avatar">
                    <div class="avatar-img" style="background: linear-gradient(135deg, #CD7F32, #8B4513); display: flex; align-items: center; justify-content: center; font-size: 20px;">🥉</div>
                </div>
                <div class="result-info">
                    <div class="result-name">${positions[2].character.name}</div>
                </div>
            </div>`;
    }
    
    resultsDiv.innerHTML = resultsHTML;
    
    // console.log('Результаты гонки:');
    // positions.forEach((pos, index) => {
    //     console.log(`${index + 1} место: ${pos.character.name}`);
    // });
}
         else {
            animationId = requestAnimationFrame(moveTracks);
        }
    }
    
    moveTracks();
})

//// Тут работа с user



const userPanel = document.createElement('div');
userPanel.className = 'user-panel';
userPanel.innerHTML = `
    <div class="user-avatar">
        <img src="avatar-placeholder.png" alt="" class="avatar-img">
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


