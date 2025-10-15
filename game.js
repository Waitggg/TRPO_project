const characters = [
    { id: 1, name: "Спринтер", color: "#FF6B6B", speed: 8 },
    { id: 2, name: "Марафонец", color: "#4ECDC4", speed: 6 },
    { id: 3, name: "Чювак", color: "#FE6B6B", speed: 80 }
];

const container = document.getElementById('container');
const buttonInv = document.getElementById('ButtonInv');
const buttonStart = document.getElementById('ButtonStart');
const buttonReset = document.getElementById('ButtonReset');
let raceInProgress = false;
let isMenuOpened = false;
let animationId = null;

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

    for(let i = 0; i < characters.length; i++)
    {
        const newMDiv = document.createElement('div');
        newMDiv.classList.add('characterInMenu');
        newMDiv.id = `char${i}`;
        newDiv.appendChild(newMDiv);
        newMDiv.textContent = characters[i].name + " СКОРОЧТЬ!!: " + characters[i].speed;

        const killButton = document.createElement("button");
        killButton.textContent = "X";
        killButton.classList.add('killButton');
        killButton.id = `killButton${i}`;
        newMDiv.appendChild(killButton);

        const addButton = document.createElement('button');
        addButton.textContent = 'Добавить';
        addButton.classList.add('addButton');
        newMDiv.appendChild(addButton);
        addButton.id = `addButton${i}`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.classList.add('deleteButton');
        newMDiv.appendChild(deleteButton);
        deleteButton.id = `deleteButton${i}`;

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
                newDiv2.dataset.speed = characters[i].speed;
                newDiv2.dataset.position = "0";
                newDiv.appendChild(newDiv2);

                const newP = document.createElement('p');
                newP.classList.add('charTextOnTrack');
                newP.id = `charText${i}`;
                newP.textContent = characters[i].name;
                newDiv.appendChild(newP);

            }
        })

        killButton.addEventListener('click', function() {
            [`char${i}`, `track${i}`, `charText${i}`].forEach(id => 
                document.getElementById(id)?.remove()
            );
        });
        deleteButton.addEventListener('click', function()
        {
            if(document.getElementById(`track${i}`))
            {
                const div = document.getElementById('container');
                div.removeChild(document.getElementById(`track${i}`));
            }
        })
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
    
    if (!document.getElementById('inputImg')) {
        const inputImg = document.createElement('input');
        inputImg.classList.add('inputImg');
        inputImg.id = 'inputImg';
        inputImg.type = 'file';
        menuDiv.appendChild(inputImg);
        
        const fileInput = document.getElementById('inputImg');
        fileInput.addEventListener('change', function()
        {
            const file = this.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                fetch('/img', {
                  method: 'POST',
                  body: formData
                })
                .then(response => response.json())
                .then(data => {
                  console.log('Файл успешно загружен:', data);
                  fileInput.style.display = 'none';
                })
                .catch(error => {
                  console.error('Ошибка загрузки файла:', error);
                });
            }
        });
    }
}); 

})

buttonInv.addEventListener('click', function()
{
    if(container.innerHTML)
    {
        for(let i = 0; i < characters.length; i++)
        {
            let char = container.getElementById(`track${i}`); 
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
            let speed = parseInt(track.dataset.speed);
            
            if (currentPosition < finishLinePosition) {
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
            
            if (winnerTrack) {
                const winnerId = parseInt(winnerTrack.dataset.characterId);
                const winnerCharacter = characters[winnerId];
                
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = `<h3>🏁 Победитель: ${winnerCharacter.name}!</h3>
                                       <p>Скорость: ${winnerCharacter.speed}</p>
                                       <p>Цвет: <span style="color:${winnerCharacter.color}">${winnerCharacter.color}</span></p>`;
                
                console.log(`Победитель: ${winnerCharacter.name}`);
            }
        } else {
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

/// тут линия финиша


const finishLine = document.createElement('div');
finishLine.classList.add('finish-line');
finishLine.id = 'globalFinishLine';
container.appendChild(finishLine);
container.style.position = 'relative';