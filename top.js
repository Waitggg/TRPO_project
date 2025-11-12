let container = document.getElementById('results');
let animationId = null;


let charData;

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/allChars');
    if (!response.ok) throw new Error('Ошибка загрузки');

    charData = await response.json();

    const allVaks = charData.runners.sort((a, b) => Number(b.speed) - Number(a.speed));
    allVaks.forEach((vak4, index)=>
    {
    if(index > 99)
    {
        return;
    }

    const formData = new FormData();
    formData.append("token", vak4.owner);
    fetch('/getUsernameByToken', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const username = data.username;
            const cardDiv = document.createElement('div');

            cardDiv.style.background = "#363B49";
            cardDiv.style.borderRadius = "10px";
            cardDiv.style.padding = "1%";
            cardDiv.style.width = "1799px";
            cardDiv.style.height = "150px";
            cardDiv.style.margin = "auto";
            cardDiv.style.marginBottom = '10px';
            cardDiv.style.marginLeft = "-1px";
            cardDiv.style.border = "1px solid #85878F";
            cardDiv.style.display = "flex";

            const charImage = document.createElement('img');
            charImage.src = vak4.url; 
            charImage.alt = vak4.name;
            charImage.style.width = '123px';
            charImage.style.height = '120px';
            charImage.style.objectFit = 'cover';
            charImage.style.borderRadius = '10px';
            charImage.style.marginBottom = '10px';
            charImage.style.border = "1px solid #85878F";

            const indexText = document.createElement('div');
            indexText.textContent = `№${index+1}`;
            indexText.style.marginRight = '20px';
            indexText.style.background = '#363B49';
            indexText.style.border = "1px solid #96979ED1";
            indexText.style.borderRadius = '10px';
            indexText.style.alignContent = 'center';
            indexText.style.height = '30px';
            indexText.style.width = '31px';
            indexText.style.textAlign = 'center';
            indexText.style.fontSize = '18px';
            
            const nameText = document.createElement('div');
            nameText.textContent = `Имя БОЙЦА: ${vak4.name}\n Владелец: ${username}`;
            nameText.style.whiteSpace = 'pre-line';
            nameText.style.marginBottom = '10px';
            nameText.style.paddingLeft = '10px';
            nameText.style.fontSize = 'xx-large';

            container.appendChild(cardDiv);
            cardDiv.appendChild(indexText);
            cardDiv.appendChild(charImage);
            cardDiv.appendChild(nameText);

        } else {
            errorDiv.textContent = data.message || 'Ошибка четотам';
        }
    })
    .catch(error => {
        console.log(error);
    });

    
    });
  } catch (err) {
    console.error(err);
  }
});

const userPanelContainer = document.createElement('div');
userPanelContainer.className = 'user-panel-container';

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
const ButtonOut = document.createElement('div');
ButtonOut.className = 'ButtonOut';

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
        alert('Выход из аккаунта...');
        document.body.removeChild(exitContainer);
        document.body.removeChild(shadowing);
    });
    
    document.getElementById('cancelExit').addEventListener('click', function() {
        document.body.removeChild(exitContainer);
        document.body.removeChild(shadowing);
    });
});