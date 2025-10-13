const characters = [
    { id: 1, name: "Спринтер", color: "#FF6B6B", speed: 8 },
    { id: 2, name: "Марафонец", color: "#4ECDC4", speed: 6 }
];

const container = document.getElementById('container');
const button1 = document.getElementById('B1');

button1.addEventListener('click', function()
{
    const newDiv = document.createElement('div');
    newDiv.classList.add('inventoryMenu');
    newDiv.textContent = characters;
    // const newDiv = document.createElement('div');
    // newDiv.classList.add('track');
    // newDiv.textContent = characters[0].name;
    // container.appendChild(newDiv);
})






































// let tracks = [];
// let raceInProgress = false;
// let results = [];

// // Инициализация игры
// function initGame() {
//     updateCharactersList();
//     addTrack(); // Добавляем первую линию по умолчанию
// }

// // Обновление списка персонажей
// function updateCharactersList() {
//     const container = document.getElementById('charactersList');
//     container.innerHTML = characters.map(char => `
//         <div style="margin: 5px 0; padding: 5px; background: ${char.color}20; border-radius: 3px;">
//             <strong>${char.name}</strong> - скорость: ${char.speed}
//         </div>
//     `).join('');
// }

// // Добавление новой линии
// function addTrack() {
//     const trackId = tracks.length + 1;
//     tracks.push({
//         id: trackId,
//         characters: [],
//         element: null
//     });
    
//     renderTracks();
// }

// // Отрисовка всех линий
// function renderTracks() {
//     const container = document.getElementById('tracks');
//     container.innerHTML = '';
    
//     tracks.forEach(track => {
//         const trackElement = document.createElement('div');
//         trackElement.className = 'track';
//         trackElement.innerHTML = `
//             <div class="finish-line"></div>
//             <div class="track-info" style="position: absolute; top: 5px; left: 10px;">
//                 Линия ${track.id}
//             </div>
//         `;
        
//         // Добавляем персонажей на линию
//         track.characters.forEach(char => {
//             const charElement = document.createElement('div');
//             charElement.className = 'character';
//             charElement.style.background = char.color;
//             charElement.style.left = '0px';
//             charElement.textContent = char.name.charAt(0);
//             charElement.title = `${char.name} (скорость: ${char.speed})`;
//             charElement.id = `char-${char.id}-track-${track.id}`;
//             trackElement.appendChild(charElement);
//         });
        
//         // Кнопка для добавления персонажа
//         const addCharBtn = document.createElement('button');
//         addCharBtn.textContent = '➕ Добавить персонажа';
//         addCharBtn.onclick = () => addCharacterToTrack(track.id);
//         addCharBtn.disabled = raceInProgress;
        
//         container.appendChild(trackElement);
//         container.appendChild(addCharBtn);
//         container.appendChild(document.createElement('br'));
//         container.appendChild(document.createElement('br'));
//     });
// }

// // Добавление персонажа на линию
// function addCharacterToTrack(trackId) {
//     if (raceInProgress) return;
    
//     const track = tracks.find(t => t.id === trackId);
//     if (!track) return;
    
//     // Выбираем случайного персонажа, которого еще нет на этой линии
//     const availableChars = characters.filter(char => 
//         !track.characters.some(trackChar => trackChar.id === char.id)
//     );
    
//     if (availableChars.length === 0) {
//         alert('Все персонажи уже на этой линии!');
//         return;
//     }
    
//     const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
//     track.characters.push({...randomChar});
    
//     renderTracks();
// }

// // Старт забега
// function startRace() {
//     if (raceInProgress) return;
    
//     // Проверяем, что на всех линиях есть персонажи
//     const emptyTracks = tracks.filter(track => track.characters.length === 0);
//     if (emptyTracks.length > 0) {
//         alert('Добавьте персонажей на все линии!');
//         return;
//     }
    
//     raceInProgress = true;
//     results = [];
//     document.getElementById('startBtn').disabled = true;
//     document.getElementById('results').innerHTML = 'Забег начался!';
    
//     // Запускаем движение на каждой линии
//     tracks.forEach(track => {
//         startTrackRace(track.id);
//     });
// }

// // Запуск забега на конкретной линии
// function startTrackRace(trackId) {
//     const track = tracks.find(t => t.id === trackId);
//     if (!track) return;
    
//     const trackWidth = document.querySelector('.track').offsetWidth - 50;
//     let finished = 0;
    
//     track.characters.forEach(character => {
//         let position = 0;
//         const charElement = document.getElementById(`char-${character.id}-track-${trackId}`);
        
//         const moveInterval = setInterval(() => {
//             if (!raceInProgress) {
//                 clearInterval(moveInterval);
//                 return;
//             }
            
//             position += character.speed;
//             charElement.style.left = position + 'px';
            
//             // Проверка финиша
//             if (position >= trackWidth) {
//                 clearInterval(moveInterval);
//                 finished++;
                
//                 // Записываем результат
//                 if (!results.find(r => r.characterId === character.id && r.trackId === trackId)) {
//                     results.push({
//                         characterId: character.id,
//                         trackId: trackId,
//                         characterName: character.name,
//                         time: Date.now()
//                     });
                    
//                     updateResults();
//                 }
                
//                 // Если все персонажи на линии финишировали
//                 if (finished === track.characters.length) {
//                     checkRaceComplete();
//                 }
//             }
//         }, 100);
//     });
// }

// // Обновление результатов
// function updateResults() {
//     const resultsContainer = document.getElementById('results');
//     const sortedResults = [...results].sort((a, b) => a.time - b.time);
    
//     resultsContainer.innerHTML = sortedResults.map((result, index) => `
//         <div style="margin: 5px 0; padding: 8px; background: white; border-radius: 5px; border-left: 4px solid ${getCharacterColor(result.characterId)}">
//             ${index + 1}. ${result.characterName} (Линия ${result.trackId})
//         </div>
//     `).join('');
// }

// // Получение цвета персонажа по ID
// function getCharacterColor(characterId) {
//     const char = characters.find(c => c.id === characterId);
//     return char ? char.color : '#ccc';
// }

// // Проверка завершения всего забега
// function checkRaceComplete() {
//     const totalCharacters = tracks.reduce((sum, track) => sum + track.characters.length, 0);
//     if (results.length === totalCharacters) {
//         raceInProgress = false;
//         document.getElementById('startBtn').disabled = false;
//         document.getElementById('results').innerHTML = 
//             '<h3>🏁 Забег завершен!</h3>' + document.getElementById('results').innerHTML;
//     }
// }

// // Сброс забега
// function resetRace() {
//     raceInProgress = false;
//     results = [];
//     document.getElementById('startBtn').disabled = false;
//     document.getElementById('results').innerHTML = '';
    
//     // Сбрасываем позиции персонажей
//     tracks.forEach(track => {
//         track.characters = [];
//     });
    
//     renderTracks();
// }

// // Запуск игры при загрузке страницы
// window.onload = initGame;