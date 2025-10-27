let container = document.getElementById('results');
let animationId = null;


let charData;

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/chars');
    if (!response.ok) throw new Error('Ошибка загрузки');

    charData = await response.json();

    const allVaks = charData.runners.sort((a, b) => Number(b.speed) - Number(a.speed));
    allVaks.forEach((vak4, index)=>
    {
    if(index > 99)
    {
        return;
    }
    const cardDiv = document.createElement('div');
    cardDiv.style.background = "dimgray";
    cardDiv.style.borderRadius = "10px";
    cardDiv.style.padding = "1%";
    cardDiv.style.width = "500px";
    cardDiv.style.margin = "auto";
    cardDiv.style.marginBottom = '10px';
    cardDiv.style.display = "flex";

    const charImage = document.createElement('img');
    charImage.src = vak4.url; 
    charImage.alt = vak4.name;
    charImage.style.width = '200px';
    charImage.style.height = '200px';
    charImage.style.objectFit = 'cover';
    charImage.style.borderRadius = '10px';
    charImage.style.marginBottom = '10px';

    const indexText = document.createElement('div');
    indexText.textContent = `#${index+1}`;
    indexText.style.marginRight = '20px';
    indexText.style.background = 'gray';
    indexText.style.borderRadius = '10px';
    indexText.style.height = '40px';
    indexText.style.width = '80px';
    indexText.style.textAlign = 'center';
    indexText.style.fontSize = '30px';
    
    const nameText = document.createElement('div');
    nameText.textContent = `Имя БОЙЦА: ${vak4.name}`;
    nameText.style.marginBottom = '10px';
    nameText.style.paddingLeft = '10px';
    nameText.style.fontSize = 'xx-large';

    container.appendChild(cardDiv);
    cardDiv.appendChild(indexText);
    cardDiv.appendChild(charImage);
    cardDiv.appendChild(nameText);
    });
  } catch (err) {
    console.error(err);
  }
});

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

