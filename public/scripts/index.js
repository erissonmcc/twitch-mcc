import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import {
    getAuth,
    signInWithCustomToken,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import {
    getFirestore,
    doc,
    getDoc,
    onSnapshot,
    updateDoc,
    increment
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import {
    getDatabase,
    ref,
    get,
    child
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDD5UGApGmnddV1nCkibQi0yC6ZOpPhWqA",
    authDomain: "linen-diorama-427712-c4.firebaseapp.com",
    projectId: "linen-diorama-427712-c4",
    storageBucket: "linen-diorama-427712-c4.firebasestorage.app",
    messagingSenderId: "250158598373",
    appId: "1:250158598373:web:b1637a75fd41fc6f936c0c",
    measurementId: "G-3JFG7302YG"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let user;
const isLocal = window.location.hostname === 'localhost';
const netlifyEndpoit = isLocal ? "http://localhost:8888/.netlify/functions": "https://twitch-mcc.netlify.app/.netlify/functions";
const clientId = '5fyofmchlg3budslz7ivuouz0u8cff';

if (!isLocal) console.warn("AVISO: Este console é destinado a ambientes de e teste. Para garantir sua segurança, nenhuma informação sensível é exibida aqui na área de produção.");

// Definindo o objeto csl
const csl = {
    // Para 'log'
    log: function(...messages) {
        if (isLocal) {
            console.log(...messages);
        }
    },

    // Para 'info'
    info: function(...messages) {
        if (isLocal) {
            console.info(...messages);
        }
    },

    // Para 'warn'
    warn: function(...messages) {
        if (isLocal) {
            console.warn(...messages);
        }
    },

    // Para 'error'
    error: function(...messages) {
        if (isLocal) {
            console.error(...messages);
        }
    },

    // Para 'debug'
    debug: function(...messages) {
        if (isLocal) {
            console.debug(...messages);
        }
    },

    // Para 'table'
    table: function(...messages) {
        if (isLocal) {
            console.table(...messages);
        }
    },

    // Para 'assert'
    assert: function(...messages) {
        if (isLocal) {
            console.assert(...messages[0], ...messages.slice(1));
        }
    },

    // Para 'trace'
    trace: function(...messages) {
        if (isLocal) {
            console.trace(...messages);
        }
    },

    // Para 'count'
    count: function(...messages) {
        if (isLocal) {
            console.count(...messages);
        }
    },

    // Para 'countReset'
    countReset: function(...messages) {
        if (isLocal) {
            console.countReset(...messages);
        }
    },

    // Para 'group'
    group: function(...messages) {
        if (isLocal) {
            console.group(...messages);
        }
    },

    // Para 'groupEnd'
    groupEnd: function() {
        if (isLocal) {
            console.groupEnd();
        }
    },

    // Para 'time'
    time: function(...messages) {
        if (isLocal) {
            console.time(...messages);
        }
    },

    // Para 'timeEnd'
    timeEnd: function(...messages) {
        if (isLocal) {
            console.timeEnd(...messages);
        }
    }
};

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
    .then(function(registration) {
        csl.log('Service Worker registrado com sucesso:', registration);
    })
    .catch(function(error) {
        csl.log('Falha ao registrar o Service Worker:', error);
    });
}

if (!navigator.onLine) {
    document.querySelector('.loader').style.display = 'none';
    document.querySelector('.offline').style.display = 'flex';
}

const overlay = document.querySelector('.overlay-live');
const embedElement = document.getElementById('twitch-embed');

const hammer = new Hammer(overlay);

hammer.get('pinch').set({
    enable: true
});
hammer.get('pan').set({
    direction: Hammer.DIRECTION_ALL, enable: true
});

// Variáveis de controle
let currentScale = 1; // Escala atual (inicia com 1)
let initialScale = 1; // Escala inicial (para resetar)
let lastScale = 1; // Última escala aplicada
let lastX = 0; // Última posição X do overlay
let lastY = 0; // Última posição Y do overlay
let isPanning = false; // Flag para saber se o gesto de pan está ativo
let pinchStartX = 0; // Posição inicial X do gesto de pinça
let pinchStartY = 0; // Posição inicial Y do gesto de pinça
let pinchLastScale = 1; // Última escala no início do gesto de pinça
let pinchend = false; // Flag para controle do final do gesto de pinça

// Limites de escala
const minScale = 1;
const maxScale = 2;

// Funções para manipulação do gesto de pinça (zoom)
function onPinchStart(event) {
    // Armazena a posição inicial no início do gesto de pinça
    pinchStartX = lastX;
    pinchStartY = lastY;
    pinchLastScale = currentScale;
}

function onPinch(event) {
    // Calcula a nova escala com base no gesto de pinça
    let scale = event.scale * pinchLastScale;

    // Aplica os limites de escala
    scale = Math.max(minScale, Math.min(scale, maxScale));

    // Se está no zoom out total (escala mínima), reseta a posição
    if (scale === 1) {
        resetPosition();
    } else {
        updatePosition(event, scale);
    }

    // Atualiza a escala atual
    currentScale = scale;
}

function onPinchEnd(event) {
    // Atualiza a escala final após o gesto
    initialScale *= event.scale;
    lastScale = event.scale;
}

// Funções para manipulação do gesto de pan (movimento)
function onPanStart(event) {
    if (currentScale > 1) {
        isPanning = true; // Inicia o pan somente se a escala for maior que 1
    }
}

function onPanMove(event) {
    if (isPanning && currentScale > 1) {
        // Calcula o deslocamento do movimento
        const offsetX = lastX + event.deltaX;
        const offsetY = lastY + event.deltaY;

        // Aplica os limites ao deslocamento
        applyBounds(embedElement, offsetX, offsetY, currentScale);
    }
}

function onPanEnd(event) {
    if (isPanning) {
        // Atualiza as últimas posições quando o gesto de pan termina
        lastX += event.deltaX;
        lastY += event.deltaY;
        isPanning = false;
    }
}

// Função para atualizar a posição durante o zoom
function updatePosition(event, scale) {
    embedElement.style.transition = ''; // Remove a transição durante o zoom

    // Calcula o deslocamento relativo com base no zoom e no ponto inicial da pinça
    const deltaX = (event.center.x - embedElement.offsetWidth / 2) / pinchLastScale;
    const deltaY = (event.center.y - embedElement.offsetHeight / 2) / pinchLastScale;

    lastX = pinchStartX + deltaX * (scale / pinchLastScale);
    lastY = pinchStartY + deltaY * (scale / pinchLastScale);

    // Aplica os limites
    applyBounds(embedElement, lastX, lastY, scale);
}

// Função para resetar a posição
function resetPosition() {
    embedElement.style.transition = 'left 0.3s ease, top 0.3s ease';
    embedElement.style.left = '0';
    embedElement.style.top = '0';
}

// Função para aplicar limites ao deslocamento
function applyBounds(element, offsetX, offsetY, scale) {
    // Função interna para calcular os limites (horizontal ou vertical)
    const calculateBounds = (originalSize, scale) => {
        const scaledSize = originalSize * scale; // Tamanho escalado
        return (scaledSize - originalSize) / 2; // Limite máximo permitido
    };

    // Limites horizontais
    const originalWidth = element.offsetWidth;
    const maxLeft = calculateBounds(originalWidth, scale);

    // Aplica o deslocamento horizontal se dentro dos limites
    if (offsetX <= maxLeft && offsetX >= -maxLeft) {
        element.style.left = `${offsetX}px`;
    } else {
        csl.warn('Deslocamento horizontal ultrapassa os limites.');
    }

    // Limites verticais
    const originalHeight = element.offsetHeight;
    const maxTop = calculateBounds(originalHeight, scale);

    // Aplica o deslocamento vertical se dentro dos limites
    if (offsetY <= maxTop && offsetY >= -maxTop) {
        element.style.top = `${offsetY}px`;
    } else {
        csl.warn('Deslocamento vertical ultrapassa os limites.');
    }

    // Aplica a escala ao elemento
    embedElement.style.transform = `scale(${scale})`;

    // Depuração em formato JSON
    csl.log({
        offsetX,
        offsetY,
        withinHorizontalBounds: offsetX >= -maxLeft && offsetX <= maxLeft,
        withinVerticalBounds: offsetY >= -maxTop && offsetY <= maxTop,
        originalWidth,
        maxLeft,
        originalHeight,
        maxTop
    });
}

// Vincula os eventos com o Hammer.js
hammer.on('pinchstart', onPinchStart);
hammer.on('pinch', onPinch);
hammer.on('pinchend', onPinchEnd);
hammer.on('panstart', onPanStart);
hammer.on('panmove', onPanMove);
hammer.on('panend', onPanEnd);

// Função para processar o login com a Twitch e chamar o backend
export function loginWithTwitch() {
    const authUrl = 'login.html';

    // Iniciar o processo de login na Twitch (deve redirecionar o usuário para o login da Twitch)
    window.location.href = authUrl;
}

let accessToken;
let userId;
let channelName;
let channelId;
let userName;

init();
async function init() {
    csl.time("Tempo para iniciar");

    // Monitorando o estado do usuário
    onAuthStateChanged(auth,
        async (userInfo) => {
            if (userInfo) {
                user = userInfo;
                csl.log('Usuário está autenticado:', userInfo);
                userId = userInfo.uid
                userName = userInfo.displayName;

                await getUserData(userInfo.uid);

                csl.timeEnd("Tempo para iniciar");
            } else {
                if (navigator.onLine) {
                    csl.log('Usuário não está autenticado');
                    loginWithTwitch();
                }
            }
        });
}

// Função para obter dados de um usuário
async function getUserData(userId) {
    csl.time("Consulta");
    // Referência para o documento
    const docRef = doc(db,
        'users',
        userId);

    try {
        // Obtendo o documento
        const docSnap = await getDoc(docRef);
        csl.timeEnd("Consulta");
        // Verificando se o documento existe
        if (docSnap.exists()) {
            // Acessando os dados do documento
            const data = docSnap.data();
            accessToken = data.accessToken;
            // Obter o path da página atual
            const path = window.location.pathname.split('/');

            csl.log(path);

            if (path[1] === 'channel') {
                channelId = path[2];

                createIframe();
                channelId = await getTwitchChannelId();
                getLiveInfo(channelId);
                setInterval(updateLiveInformation, 5000);

                document.querySelector('.live').style.display = 'flex';
                document.getElementById('live-streams').style.display = 'none';

                document.querySelector('.page-loader').style.display = 'none';
                connectChat();
                return;
            }

            // Chama a função para obter e exibir os canais seguidos e ao vivo
            if (!channelName && !channelId) {
                await getFollowedChannels();
            }
            document.querySelector('.page-loader').style.display = 'none';
        } else {
            csl.log('Nenhum usuário encontrado!');

        }
    } catch (error) {
        console.error('Erro ao obter dados do usuário:', error);

    }
}

async function getTwitchChannelId() {
    const url = `https://api.twitch.tv/helix/users?login=${channelName}`;

    const fetchChannelData = async () => {
        const response = await fetch(url,
            {
                method: 'GET',
                headers: {
                    'Client-ID': clientId,
                    'Authorization': `Bearer ${accessToken}`
                }
            });
        return response.json();
    };

    try {
        let data = await fetchChannelData();

        // Verifica se o token expirou
        if (data.message === "Invalid OAuth token") {
            csl.log('Token expirado, renovando token.');
            await renovarTokenFirebase();
            data = await fetchChannelData(); // Tenta novamente após renovar o token
        }

        if (data.data) {
            return data.data[0].id; // Retorna o ID do canal
        } else {
            console.error('Canal não encontrado');
        }
    } catch (error) {
        console.error('Erro ao buscar ID do canal:', error);
    }
}

async function getFollowedChannels() {
    try {
        const fetchFollowedChannels = async () => {
            const response = await fetch(`https://api.twitch.tv/helix/channels/followed?user_id=${userId}&first=100`, {
                method: 'GET',
                headers: {
                    'Client-ID': clientId, 'Authorization': `Bearer ${accessToken}`
                },
            });
            return response.json();
        };

        let data = await fetchFollowedChannels();

        if (data.message === "Invalid OAuth token") {
            csl.log('Token expirado, renovando token.');
            await renovarTokenFirebase();
            data = await fetchFollowedChannels();
        }

        const followedChannels = data.data;
        csl.log(data);

        const liveChannels = await getLiveChannels(followedChannels);
        displayLiveChannels(liveChannels);
    } catch (error) {
        console.error('Erro ao obter canais seguidos:', error);
    }
}

async function getLiveChannels(followedChannels) {
    const liveChannels = [];
    const userIds = followedChannels.map(channel => channel.broadcaster_id);

    try {
        let streamsData = await fetchStreams(userIds);

        // Verifica se o token está expirado e renova se necessário
        if (streamsData.message === "Invalid OAuth token") {
            csl.log('Token expirado, renovando token.');
            await renovarTokenFirebase();
            streamsData = await fetchStreams();
        }

        if (streamsData.data.length > 0) {
            const userIdsToFetch = streamsData.data.map(liveChannel => liveChannel.user_id);
            csl.log(userIdsToFetch);
            let usersData = await fetchUsers(userIdsToFetch);

            if (usersData.message === "Invalid OAuth token") {
                csl.log('Token expirado, renovando token.');
                await renovarTokenFirebase();
                usersData = await fetchUsers(userIdsToFetch);
            }

            const usersInfo = Object.fromEntries(usersData.data.map(user => [user.id, user]));

            streamsData.data.forEach(liveChannel => {
                const user = usersInfo[liveChannel.user_id];
                if (user) {
                    liveChannels.push({
                        userName: user.display_name,
                        userId: user.id,
                        description: user.description,
                        profileImage: user.profile_image_url,
                        title: liveChannel.title,
                        viewers: liveChannel.viewer_count,
                        thumbnail: liveChannel.thumbnail_url,
                        streamUrl: `https://www.twitch.tv/${user.login}`,
                        started: liveChannel.started_at,
                        login: user.login
                    });
                }
            });
        }

        csl.log(liveChannels);
        return liveChannels;
    } catch (error) {
        console.error('Erro ao verificar as lives:',
            error);
    }
}

const fetchStreams = async (userIds) => {
    const response = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userIds.join('&user_id=')}`,
        {
            method: 'GET',
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${accessToken}`
            },
        });
    return response.json();
};

const fetchUsers = async (userIdsToFetch) => {
    const response = await fetch(`https://api.twitch.tv/helix/users?id=${userIdsToFetch.join('&id=')}`,
        {
            method: 'GET',
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${accessToken}`
            },
        });
    return response.json();
};

let intervalTimeLive;

async function getLiveInfo(channelId) {
    const [liveInfo, channelnfo] = await Promise.all([
        fetchStreams([`${channelId}`]),
        fetchUsers([`${channelId}`]),
    ]);

    const infos = {
        userName: channelnfo.data[0].display_name,
        profileImage: channelnfo.data[0].profile_image_url,
        title: liveInfo.data[0].title,
        viewers: liveInfo.data[0].viewer_count.toLocaleString('pt-BR'),
        thumbnail: liveInfo.data[0].thumbnail_url.replace('{width}',
            '1280').replace('{height}',
            '720'),
    };

    displayUpdateInfoLive(infos);
    const started = liveInfo.data[0].started_at
    timeLive(started);
    intervalTimeLive = setInterval(() => timeLive(liveChannel.started),
        1000);
}

function timeLive(startTime) {
    const initialTime = new Date(startTime);
    const currentTime = new Date();

    let difference = Math.floor((currentTime - initialTime) / 1000);

    const hours = String(Math.floor(difference / 3600)).padStart(2,
        '0');
    difference %= 3600;

    const minutes = String(Math.floor(difference / 60)).padStart(2,
        '0');
    const seconds = String(difference % 60).padStart(2,
        '0');
    const display = document.getElementById('time');

    display.textContent = `${hours}:${minutes}:${seconds}`;
}


async function updateLiveInformation() {
    const liveInfo = await fetchStreams([`${channelId}`]);

    const infos = {
        title: liveInfo.data[0].title,
        viewers: liveInfo.data[0].viewer_count.toLocaleString('pt-BR'),
    };
    const title = document.querySelector('.info p');
    title.textContent = infos.title;

    const viewers = document.querySelector('.info .viewers span');
    viewers.textContent = infos.viewers;
}

function displayUpdateInfoLive(infos) {
    const miniatureElement = document.getElementById('miniature');
    miniatureElement.innerHTML = `
    <div class="loading-spinner">
    <svg class="loading-spinner__circle-svg" viewBox="25 25 50 50">
    <circle class="loading-spinner__circle-stroke" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10" />
    </svg>
    </div>
    <img class="lazy" src="${infos.thumbnail.replace('{width}',
        '1280').replace('{height}',
        '720')}" alt="Miniatura de ${infos.userName}">
    `.trim();
    const infoElement = document.querySelector('.info');
    infoElement.innerHTML = `
    <div class="avatar-conteiner">
    <img class="avatar lazy" src="${infos.profileImage}">
    </div>

    <div class="info-text">
    <h2>${infos.userName}</h2>
    <p>${infos.title}</p>
    <div class="viewers"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2 7.5 4.019 7.5 6.5zM20 21h1v-1c0-3.859-3.141-7-7-7h-4c-3.86 0-7 3.141-7 7v1h17z"/></svg> <span>${infos.viewers} espectadores</span></div>
    </div>

    `;
}

// Função para exibir os canais ao vivo no HTML
function displayLiveChannels(liveChannels) {
    const liveStreamsDiv = document.getElementById('live-streams');
    if (liveChannels.length === 0) {
        liveStreamsDiv.innerHTML = '<p>Não há lives ao vivo no momento.</p>';
        return;
    }

    liveChannels.forEach(liveChannel => {
        const streamElement = document.createElement('div');
        streamElement.classList.add('stream-item');

        streamElement.innerHTML = `
        <div class="thumbnail-conteiner">
        <img class="thumbnail lazy" src="${liveChannel.thumbnail.replace('{width}', '1280').replace('{height}', '720')}" alt="Capa da stream">
        </div>
        <div class="stream-info">
        <div class="avatar-conteiner">
        <img class="avatar lazy" src="${liveChannel.profileImage}">
        </div>
        <div class="info-text">
        <h2>${liveChannel.userName}</h2>
        <p>${liveChannel.title}</p>
        <p class="viewers">${liveChannel.viewers.toLocaleString('pt-BR')} espectadores</p>
        </div>
        </div>
        `;

        streamElement.addEventListener('click', function() {
            
            history.pushState({ page: "live" }, `Live de ${userName}`, `/channel/${liveChannel.login}`);
            timeLive(liveChannel.started);
            intervalTimeLive = setInterval(() => timeLive(liveChannel.started), 1000);
            displayUpdateInfoLive(liveChannel);
            setInterval(updateLiveInformation, 5000);
            channelId = liveChannel.userId;
            channelName = liveChannel.userName;

            document.querySelector('.live').style.display = 'flex';
            document.getElementById('live-streams').style.display = 'none';
            createIframe();
            connectChat();
        });

        liveStreamsDiv.appendChild(streamElement);
    });
    const pageLoader = document.querySelector(".page-loader");
    pageLoader.style.display = 'none';
}

let socket;

window.addEventListener('popstate', function(event) {
    const path = window.location.pathname;
    if (path === '' || path === 'index') {
        embed.destroy();
        clearInterval(intervalTimeLive);
        socket.disconnect();
        document.getElementById('liveElement').style.display = 'none';
    }

});

let isFistPlay = true;
let embed;

document.querySelector('.reload').addEventListener('click', () => {
    clearTimeHideControls();
    isFistPlay = true;
    const miniature = document.getElementById('miniature');
    const miniatureImg = document.querySelector('#miniature img');
    let currentSrc = miniatureImg.src;
    let currentTime = new Date().getTime();
    let newSrc = currentSrc.split('?')[0] + '?t=' + currentTime;
    miniatureImg.src = newSrc;
    miniature.style.display = 'flex';
    embed.destroy();
    createIframe();
});

function createIframe() {
    try {
        // Inicializa o player Twitch Embed
        embed = new Twitch.Embed("twitch-embed",
            {
                width: "100%",
                height: "100%",
                channel: channelName,
                parent: ["localhost"],
                layout: 'video',
                controls: false,
                muted: false,
                autoplay: true
            });

        let player;

        // Quando o embed estiver pronto, captura o player
        embed.addEventListener(Twitch.Embed.VIDEO_READY,
            () => {
                player = embed.getPlayer();
            });

        const buttonImages = {
            play: `<path d="M7 6v12l10-6z"/>`,
            pause: `<path d="M8 7h3v10H8zm5 0h3v10h-3z"/>`,
            mute: `<path d="m7.727 6.313-4.02-4.02-1.414 1.414 18 18 1.414-1.414-2.02-2.02A9.578 9.578 0 0 0 21.999 12c0-4.091-2.472-7.453-5.999-9v2c2.387 1.386 3.999 4.047 3.999 7a8.13 8.13 0 0 1-1.671 4.914l-1.286-1.286C17.644 14.536 18 13.19 18 12c0-1.771-.775-3.9-2-5v7.586l-2-2V2.132L7.727 6.313zM4 17h2.697L14 21.868v-3.747L3.102 7.223A1.995 1.995 0 0 0 2 9v6c0 1.103.897 2 2 2z"/>`,
            unmute: `<path d="M16 7v10c1.225-1.1 2-3.229 2-5s-.775-3.9-2-5zM4 17h2.697L14 21.868V2.132L6.697 7H4c-1.103 0-2 .897-2 2v6c0 1.103.897 2 2 2z"/>`
        };


        embed.addEventListener(Twitch.Embed.VIDEO_PLAY,
            function() {
                if (!isFistPlay) return;
                showElements();
                isFistPlay = false;
                const miniature = document.getElementById('miniature');
                miniature.style.display = 'none';

                player.setQuality('auto');

                document.querySelector('.configs').style.display = 'block';
                // Obtém todas as qualidades disponíveis
                const qualities = player.getQualities();
                csl.log('Qualidades', qualities);
                const qualitiesContainer = document.getElementById('qualities');

                // Limpa o container de qualidades antes de adicionar novos itens
                qualitiesContainer.innerHTML = '';

                // Cria um formulário para os inputs de rádio
                const form = document.createElement('form');
                form.classList.add('qualities-form');

                // Itera sobre as qualidades e cria inputs de rádio
                qualities.forEach(quality => {
                    const label = document.createElement('label');
                    label.classList.add('quality-label');

                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = 'quality';
                    radio.value = quality.group; // Define o valor do rádio
                    radio.classList.add('quality-radio');
                    if (quality.group == 'auto') radio.checked = true;

                    // Adiciona um evento de mudança (change) ao input
                    radio.addEventListener('change', function() {
                        player.setQuality(quality.group);
                        const configButton = document.getElementById("config-button");
                        const popup = document.getElementById("config-popup");

                        popup.style.display = 'none';
                        configButton.style.pointerEvents = 'auto';
                        configButton.style.cursor = 'pointer';
                        configButton.disabled = false;
                        popup.style.animation = '0.3s fadeAndDownIn';
                        setTimeout(function() {
                            popup.style.animation = '';
                            popup.style.display = 'none';
                        }, 300);
                    });

                    // Define o texto visível do rótulo
                    label.textContent = quality.group == 'auto' ? 'Automático': quality.name;
                    label.prepend(radio);

                    // Adiciona o rótulo ao formulário
                    form.appendChild(label);
                });

                // Adiciona o formulário ao container de qualidades
                qualitiesContainer.appendChild(form);
            });

        embed.addEventListener(Twitch.Embed.VIDEO_PLAY,
            () => updateButtonImage('pause'));
        embed.addEventListener(Twitch.Embed.VIDEO_PAUSE,
            () => updateButtonImage('play'));

        function updateButtonImage(state) {
            const toggleImg = document.querySelector('.toggle svg');
            const muteImg = document.querySelector('.mute svg');

            if (state === 'play' || state === 'pause') {
                toggleImg.innerHTML = buttonImages[state];
            } else if (state === 'mute' || state === 'unmute') {

                muteImg.innerHTML = buttonImages[state];
            }
        }

        // Botão de Play/Pause
        document.querySelector('.toggle').addEventListener('click', () => {
            clearTimeHideControls();
            player = embed.getPlayer();
            if (player) {
                if (player.isPaused()) {
                    player.play();
                } else {
                    player.pause();
                }
                csl.log("Player Paused:", player.isPaused());
            }
        });

        // Botão de Mute/Unmute
        document.querySelector('.mute').addEventListener('click',
            () => {
                clearTimeHideControls();
                if (player) {
                    player = embed.getPlayer();
                    if (player.getMuted()) {
                        player.setMuted(false);
                        updateButtonImage('unmute');
                    } else {
                        player.setMuted(true);
                        updateButtonImage('mute');
                    }
                    csl.log("Player Muted:", player.getMuted());
                }
            });
    } catch (e) {
        csl.log('Erro ao iniciar embed:',
            e);
    }
}

let popupElementInAnimation = false;
let itemSetting = 'none';
document.querySelector('.back').addEventListener('click', () => {
    clearTimeHideControls();
    switch (itemSetting) {
        case 'Qualidade':
            if (popupElementInAnimation) return;

            popupElementInAnimation = true;

            // Seleção de elementos
            const backButton = document.querySelector('.back');
            const optionsContainer = document.querySelector('.options');
            const qualitiesContainer = document.querySelector('.qualities-conteiner');
            const popupTop = document.querySelector('.popup-top');

            // Ajustes iniciais de estilo e animação
            backButton.style.display = 'none';
            qualitiesContainer.style.cssText = `
            position: absolute;
            animation: 0.3s swipeRightOut;
            `;
            popupTop.style.cssText = `
            position: absolute;
            animation: 0.3s slideUpInNoP forwards;
            `;

            popup.style.animation = '0.3s contract forwards';
            optionsContainer.style.cssText = `
            display: block;
            animation: 0.3s swipeRightIn;
            `;

            // Limpeza de estilos e ajustes após a animação
            setTimeout(() => {
                qualitiesContainer.style.cssText = 'display: none;';
                optionsContainer.style.cssText = ``;
                popup.style.animation = '';
                popupTop.style.cssText = 'display: none;';
            }, 300);

            // Finalização da flag de animação
            setTimeout(() => {
                popupElementInAnimation = false;
            }, 600);
            break;
        default:
            alert('Opção desconhecida');
        }

    });
    const popup = document.getElementById("config-popup");

    // Obtém todos os itens de menu
    const menuItems = document.querySelectorAll('.options li');

    // Adiciona um evento de click a cada item
    menuItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.stopPropagation();
            clearTimeHideControls();
            const optionText = item.querySelector('span').innerText;
            itemSetting = optionText;
            switch (optionText) {
                case 'Qualidade':
                    if (popupElementInAnimation == true) return;

                    popupElementInAnimation = true;
                    // Define a altura atual do popup
                    document.documentElement.style.setProperty('--current-height', `${popup.scrollHeight}px`);

                    // Seleciona os elementos necessários
                    const backButton = document.querySelector('.back');
                    const optionsContainer = document.querySelector('.options');
                    const qualitiesContainer = document.querySelector('.qualities-conteiner');
                    const popupTop = document.querySelector('.popup-top');

                    // Aplica estilos e animações iniciais
                    optionsContainer.style.cssText = `
                    position: absolute;
                    animation: 0.3s swipeLeftOut;
                    `;

                    backButton.style.display = 'block';
                    qualitiesContainer.style.cssText = `
                    display: flex;
                    animation: 0.3s swipeLeftIn forwards;
                    `;
                    popupTop.style.cssText = `
                    display: flex;
                    animation: 0.3s slideDownInNoP forwards;
                    `;

                    document.documentElement.style.setProperty('--new-height', `${popup.scrollHeight}px`);
                    popup.style.animation = '0.3s expand forwards';

                    // Remove estilos e animações após a transição
                    setTimeout(() => {
                        optionsContainer.style.cssText = '';
                        popup.style.animation = '';
                        optionsContainer.style.display = 'none';
                        popupTop.style.cssText = `
                        transform: translateY(0);
                        display: flex;
                        `;
                    }, 300);

                    setTimeout(function() {
                        popupElementInAnimation = false;
                    }, 600);
                    break;
                default:
                    alert('Opção desconhecida');
                }
            });
        });

        const configButton = document.getElementById("config-button");
        const closePopup = document.querySelector(".popup-close");

        configButton.addEventListener("click", function(event) {
            event.stopPropagation();
            clearTimeHideControls();
            popup.style.display = 'flex';
            popup.style.animation = '0.3s fadeAndUpIn';
            setTimeout(function() {
                popup.style.animation = '';
            },
                300);

            configButton.style.pointerEvents = 'none';
            configButton.style.cursor = '';
            configButton.disabled = true;
            const optionsContainer = document.querySelector('.options');
            const qualitiesContainer = document.querySelector('.qualities-conteiner');
            const backButton = document.querySelector('.back');

            optionsContainer.style.display = 'block';
            qualitiesContainer.style.display = 'none';
            backButton.style.display = 'none';
            csl.log('Esse botão está sendo clicado por algum motivo!');
        });

        window.addEventListener('click', function(event) {

            if (event.target !== configButton) {
                popup.style.animation = '0.3s fadeAndDownIn';
                const popupTop = document.querySelector('.popup-top');

                setTimeout(function() {
                    popup.style.animation = '';
                    popup.style.display = 'none';
                    popupTop.style.cssText = 'display: none; animation: none';
                }, 300);
                configButton.style.pointerEvents = 'auto';
                configButton.style.cursor = 'pointer';
                configButton.disabled = false;
            }
        });

        popup.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Área do chat
        const chatDiv = document.getElementById('messages');

        async function fetchBadges() {
            const headers = {
                "Client-ID": clientId,
                "Authorization": `Bearer ${accessToken}`
            };

            const fetchBadgesData = async (url) => {
                const response = await fetch(url,
                    {
                        headers
                    });
                return response.json();
            };

            try {
                // Função para obter e verificar se o token expirou
                const fetchWithTokenCheck = async (url) => {
                    let badges = await fetchBadgesData(url);
                    if (badges.message === "Invalid OAuth token") {
                        csl.log('Token expirado, renovando token.');
                        await renovarTokenFirebase();
                        badges = await fetchBadgesData(url); // Refaz a requisição após renovar o token
                    }
                    return badges;
                };

                // Requisições em paralelo para badges globais e do canal
                const [globalBadges,
                    channelBadges] = await Promise.all([
                        fetchWithTokenCheck("https://api.twitch.tv/helix/chat/badges/global"),
                        fetchWithTokenCheck(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${channelId}`)
                    ]);

                return {
                    globalBadges: globalBadges.data,
                    channelBadges: channelBadges.data
                };
            } catch (error) {
                console.error('Erro ao buscar badges:', error);
            }
        }

        let autoScroll = true;
        let messagesCount = 0;

        // Função para conectar ao chat via WebSocket
        async function connectChat() {
            const [badges,
                allEmotesExtension] = await Promise.all([
                    fetchBadges(),
                    getAllEmotes(channelId)
                ]);
            csl.log(allEmotesExtension);

            csl.log(badges);
            const oauthToken = `oauth:${accessToken}`; // Substitua com seu OAuth accessToken
            socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

            socket.onopen = () => {
                csl.log("Conectado ao chat da Twitch!");

                // Enviar a autenticação para o chat
                socket.send("CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership");
                socket.send(`PASS ${oauthToken}`);
                socket.send(`NICK ${userName}`);
                socket.send(`JOIN #${channelName}`);
            };

            socket.onmessage = async (message) => {
                const data = message.data;

                if (data.startsWith('PING')) {
                    csl.log('Recebido PING do servidor. Enviando PONG...');
                    socket.send('PONG :tmi.twitch.tv');
                } else if (data.includes("PRIVMSG")) {

                    // Transformando as tags em um objeto
                    const tagsObject = Object.fromEntries(data.split(";").map(tag => tag.split("=")));

                    const match = data.match(/PRIVMSG #[\w]+ :(.+)/);


                    const message = match[1];

                    const emotes = tagsObject["emotes"].split('/');

                    let formattedMessage;
                    formattedMessage = await replaceEmotes(message, emotes, allEmotesExtension);

                    // Obtém os badges do usuário
                    const userBadges = tagsObject["badges"];
                    const badgeIcons = renderBadges(userBadges, badges);

                    const messageElement = document.createElement("div");
                    messageElement.classList.add("chat-message");
                    messageElement.innerHTML = `
                    ${badgeIcons ? `<span class="badges">${badgeIcons}</span>`: ''}
                    <strong style="color: ${tagsObject["color"] || generateUsernameColor(tagsObject["display-name"])}">${tagsObject["display-name"]}:</strong> ${formattedMessage}
                    `;

                    chatDiv.appendChild(messageElement);
                    if (!autoScroll) {
                        messagesCount++;
                        const back = document.querySelector(".back-down");
                        const backText = document.getElementById('backText');

                        if (messagesCount > 1) {
                            backText.textContent = `${messagesCount} novas mensagens`;
                        } else {
                            backText.textContent = `${messagesCount} nova mensagem`;
                        }
                        backText.style.display = 'block';
                        back.style.display = 'flex';
                        back.style.animation = '0.3s fadeIn forwards';
                    }
                    scrollDown();
                }
            };

            socket.onerror = (error) => {
                console.error("Erro no WebSocket:", error);
            };

            socket.onclose = (e) => {
                csl.log("Desconectado do chat da Twitch", e);
            };
        }

        function generateUsernameColor(username) {

            // Cria um hash simples do nome de usuário
            let hash = 0;
            for (let i = 0; i < username.length; i++) {
                hash = username.charCodeAt(i) + ((hash << 5) - hash);
            }

            // Converte o hash em uma cor hexadecimal
            let color = "#";
            for (let i = 0; i < 3; i++) {
                const value = (hash >> (i * 8)) & 0xFF;
                color += ("00" + value.toString(16)).slice(-2);
            }

            return color;
        }

        // Função para obter emotes globais do 7TV
        async function get7TVGlobalEmotes() {
            const response = await fetch('https://7tv.io/v3/emote-sets/global');
            if (!response.ok) {
                throw new Error('Falha ao obter emotes globais do 7TV');
            }
            const data = await response.json();
            return data;
        }

        // Função para obter emotes de um canal específico do 7TV
        async function get7TVChannelEmotes(channelId) {
            const response = await fetch(`https://7tv.io/v3/users/twitch/${channel}`);
            if (!response.ok) {
                throw new Error(`Falha ao obter emotes do canal ${channelId} do 7TV`);
            }
            const data = await response.json();
            return data;
        }

        // Função para obter emotes globais do BTTV
        async function getBTTVGlobalEmotes() {
            const response = await fetch('https://api.betterttv.net/3/cached/emotes/global');
            if (!response.ok) {
                throw new Error('Falha ao obter emotes globais do BTTV');
            }
            const data = await response.json();
            return data;
        }

        // Função para obter emotes de um canal específico do BTTV
        async function getBTTVChannelEmotes(channelId) {
            const response = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${channelId}`);
            if (!response.ok) {
                throw new Error(`Falha ao obter emotes do canal ${channelId} do BTTV`);
            }
            const data = await response.json();
            return data;
        }

        // Função para obter todos os emotes globais e de canal do 7TV e BTTV
        async function getAllEmotes(channelId) {
            try {
                // As chamadas são feitas paralelamente com Promise.all
                const [global7TV,
                    globalBTTV,
                    channel7TV,
                    channelBTTV] = await Promise.all([
                        get7TVGlobalEmotes().catch(() => []), // Retorna um array vazio em caso de erro
                        getBTTVGlobalEmotes().catch(() => []), // Retorna um array vazio em caso de erro
                        get7TVChannelEmotes(channelId).catch(() => []), // Retorna um array vazio em caso de erro
                        getBTTVChannelEmotes(channelId).catch(() => []) // Retorna um array vazio em caso de erro
                    ]);

                return {
                    global7TV,
                    globalBTTV,
                    channel7TV,
                    channelBTTV
                };
            } catch (error) {
                // Caso haja algum erro inesperado, retorne valores padrões
                console.error("Erro ao obter emotes:", error);
                return {
                    global7TV: [],
                    globalBTTV: [],
                    channel7TV: [],
                    channelBTTV: []
                };
            }
        }

        function copiarTexto(texto) {
            // Método alternativo para navegadores mais antigos
            const textarea = document.createElement("textarea");
            textarea.value = texto;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand("copy");
                csl.log("Texto copiado com sucesso!");
            } catch (err) {
                console.error("Falha ao copiar o texto: ", err);
            }
            document.body.removeChild(textarea);

        }

        function escapeHtml(str) {
            return str.replace(/[&<>"']/g,
                function (match) {
                    const escapeMap = {
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&apos;'
                    };
                    return escapeMap[match];
                });
        }

        // Função para substituir os códigos dos emotes nas mensagens pelas imagens
        async function replaceEmotes(message, emotesId, allEmotes) {
            let result = message; // Inicialmente, não escapa o texto do usuário
            const markers = {}; // Armazenar os emotes e suas posições

            // Substitui os emotes oficiais da Twitch
            if (emotesId) {
                emotesId.forEach(emote => {
                    const [emoteName, positions] = emote.split(':');
                    if (positions) {
                        const positionList = positions.split(','); // Divide as posições por vírgula

                        positionList.forEach((position, index) => {
                            const [start, end] = position.split('-').map(Number); // Extrai as posições inicial e final

                            // Substitui o emote por um marcador temporário
                            const emoteText = Array.from(message).slice(start, end + 1).join('');
                            const marker = `__EMOTE_${emoteName}_${index}__`;
                            markers[marker] = `<img class="emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${emoteName}/default/dark/2.0" alt="${emoteName}">`;
                            result = result.replace(emoteText, marker);
                        });
                    }
                });
            }

            // Substitui os emotes de extensão (7TV e BTTV)
            const replaceWithEmoteImage = (emoteCode,
                emoteId,
                imgSize,
                platform) => {
                const emoteRegex = new RegExp(`(?<=\\s|^)${emoteCode}(?=\\s|$)`,
                    'g');
                const baseUrl = platform === 'bttv'
                ? `https://cdn.betterttv.net/emote/${emoteId}/${imgSize}`: `https://cdn.7tv.app/emote/${emoteId}/${imgSize}`;

                const marker = `__EMOTE_${emoteCode}__`;
                markers[marker] = `<img class="emote" src="${baseUrl}" alt="${emoteCode}">`;

                result = result.replace(emoteRegex,
                    marker);
            };

            // Substitui os emotes do 7TV (globais)
            if (allEmotes.global7TV?.emotes) {
                Object.values(allEmotes.global7TV.emotes).forEach(emote => {
                    replaceWithEmoteImage(emote.name, emote.id, '4x', '7tv');
                });
            }

            // Substitui os emotes do BTTV (globais)
            if (Array.isArray(allEmotes.globalBTTV)) {
                allEmotes.globalBTTV.forEach(emote => {
                    replaceWithEmoteImage(emote.code, emote.id, '3x', 'bttv');
                });
            }

            // Substitui os emotes do 7TV (de canal)
            if (allEmotes.channel7TV?.emotes) {
                Object.values(allEmotes.channel7TV.emotes).forEach(emote => {
                    replaceWithEmoteImage(emote.name, emote.id, '4x', '7tv');
                });
            }

            // Substitui os emotes do BTTV (de canal)
            if (allEmotes.channelBTTV?.channelEmotes) {
                allEmotes.channelBTTV.channelEmotes.forEach(emote => {
                    replaceWithEmoteImage(emote.code, emote.id, '3x', 'bttv');
                });
            }

            // Substitui os marcadores pelos emotes reais (evitar conflito de substituição)
            Object.keys(markers).forEach(marker => {
                result = result.replace(new RegExp(marker, 'g'), markers[marker]);
            });

            return result; // Retorna a mensagem com os emotes substituídos
        }

        function renderBadges(userBadges, badges) {
            if (!userBadges) return "";

            // Dividindo os badges do usuário
            const badgeList = userBadges.split(",");
            let badgeIcons = "";

            badgeList.forEach(badge => {
                const [badgeKey, badgeVersion] = badge.split("/");

                // Procurando os badges globais e do canal
                const badgeData = findBadge(badgeKey, badgeVersion, badges);

                if (badgeData) {
                    badgeIcons += `<img src="${badgeData.image_url_4x}" alt="${badgeKey}" class="badge-icon"> `;
                }
            });

            return badgeIcons;
        }

        // Função auxiliar para encontrar o badge nos badges globais ou do canal
        function findBadge(badgeKey, badgeVersion, badges) {
            // Procurando no array de badges do canal
            const channelBadge = badges.channelBadges.find(badge => badge.set_id === badgeKey);
            if (channelBadge) {
                // Encontrando a versão pelo id
                const version = channelBadge.versions.find(v => v.id === badgeVersion);
                if (version) return version;
            }

            // Procurando no array de badges globais
            const globalBadge = badges.globalBadges.find(badge => badge.set_id === badgeKey);
            if (globalBadge) {
                // Encontrando a versão pelo id
                const version = globalBadge.versions.find(v => v.id === badgeVersion);
                if (version) return version;
            }

            return null; // Caso não encontre o badge
        }

        const messages = document.getElementById("messages");
        let isTouch = false;
        let canScroll = true;

        // Função para rolar até o fim
        function scrollDown() {
            if (autoScroll && canScroll && !isNearBottom()) {
                messages.scrollTo({
                    top: messages.scrollHeight,
                    behavior: "smooth"
                });
                canScroll = false;
            }
        }

        // Verifica se está perto do fundo do conteúdo
        function isNearBottom() {
            return messages.scrollHeight - messages.scrollTop - messages.clientHeight <= 20;
        }

        // Lógica de scroll (parar ao rolar e reiniciar ao voltar ao fim)
        let scrollStopTime;
        messages.addEventListener('scroll', async () => {
            if (autoScroll && !canScroll && !isTouch) {
                clearTimeout(scrollStopTime);
                scrollStopTime = setTimeout(async () => {
                    await cleanUpChatMessages();
                    if (isNearBottom()) {
                        canScroll = true;
                        csl.log('Scroll parou e está no final');
                    } else if (!isNearBottom()) {
                        messages.scrollTo({
                            top: messages.scrollHeight,
                            behavior: "smooth"
                        });
                        csl.log('O scroll parou e não está no final');
                    }
                },
                    100);
            }

            // Lógica de controle do botão de rolagem para cima
            if (isTouch) {
                const back = document.querySelector(".back-down");

                if (isNearBottom() && !autoScroll) {
                    autoScroll = true;
                    back.style.animation = '0.3s fadeOut forwards';
                    setTimeout(() => {
                        back.style.display = 'none';
                    }, 300);
                } else if (!isNearBottom() && autoScroll) {
                    autoScroll = false;
                    const backText = document.getElementById('backText');
                    backText.style.display = 'none';
                    back.style.display = 'flex';
                    back.style.animation = '0.3s fadeIn forwards';
                }
            }
        });

        async function cleanUpChatMessages() {
            // Seleciona todos os elementos com a classe .chat-message
            const chatMessages = document.querySelectorAll('.chat-message');

            // Verifica se há mais de 500 elementos
            if (chatMessages.length > 500) {
                let removedCount = 0;

                // Itera pelos primeiros 100 elementos
                for (let i = 0; i < chatMessages.length && removedCount < 100; i++) {
                    const message = chatMessages[i];

                    // Verifica se o atributo visible está como false
                    if (message.getAttribute('visible') === 'false') {
                        message.remove(); // Remove o elemento
                        removedCount++; // Incrementa o contador de elementos removidos
                    }
                }
            }
        }

        // Detecta movimento e fim do toque
        messages.addEventListener('touchmove', () => isTouch = true);
        messages.addEventListener('touchend', () => isTouch = false);


        const backDown = document.querySelector('.back-down');

        backDown.addEventListener('click', function() {
            backDown.style.display = 'none';
            messagesCount = 0;
            autoScroll = true;
            messages.scrollTop = messages.scrollHeight;
        });

        // Função para renovar o token
        async function renovarTokenFirebase() {
            csl.time("Renovar token");
            const firebaseAuthToken = await user.getIdToken(true) // Obtém o token atualizado

            const url = `${netlifyEndpoit}/renew-token`;

            try {
                // Faz a solicitação para o backend do Netlify usando fetch
                const response = await fetch(url,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${firebaseAuthToken}`,
                            "Content-Type": "application/json",
                        }
                    });

                // Verifica se a resposta foi bem-sucedida
                if (!response.ok) {
                    throw new Error(`Erro ao renovar o token: ${response.statusText}`);
                }

                const data = await response.json();
                csl.log(data);
                accessToken = data.access_token;
                csl.timeEnd("Renovar token");
            } catch (error) {
                console.error("Erro ao fazer a solicitação:", error);
            }
        }

        let orientation;

        let isVisibleChat = true;
        // Função para verificar a orientação atual
        function verificarOrientacao() {
            const chatElement = document.getElementById('chat');

            if (window.matchMedia("(orientation: portrait)").matches) {
                orientation = 'portrait';

                chatElement.style.display = 'flex';
                const liveVideo = document.querySelector('.live-video');
                liveVideo.style.width = '100%';

            } else if (window.matchMedia("(orientation: landscape)").matches) {
                orientation = 'landscape';

                if (isVisibleChat == true) {
                    chatElement.style.display = 'flex';
                    const liveVideo = document.querySelector('.live-video');
                    liveVideo.style.width = '70%';
                } else {
                    chatElement.style.display = 'none';
                    const liveVideo = document.querySelector('.live-video');
                    liveVideo.style.width = '100%';
                }
            }
        }

        // Detecta a orientação inicial
        verificarOrientacao();

        // Detecta mudanças de orientação
        window.addEventListener('resize', verificarOrientacao);

        let clickTimeout = null;
        let overlayClickCount = 0;
        let timeHideControls;
        // Função para exibir os elementos
        function showElements() {
            clearTimeHideControls();
            const infoElement = document.querySelector('.info');
            const controlsElement = document.querySelector('.controls');

            infoElement.style.display = 'flex';
            controlsElement.style.display = 'flex';
            infoElement.style.animation = '0.3s fadeIn forwards';
            controlsElement.style.animation = '0.3s fadeIn forwards';

        }

        function hideElementsTimeout() {
            timeHideControls = setTimeout(function() {
                hideElements();
                isVisibleOverlay = !isVisibleOverlay;
            }, 3000);
        }

        function clearTimeHideControls() {
            clearTimeout(timeHideControls);
            hideElementsTimeout();
        }

        // Função para ocultar os elementos
        function hideElements() {
            clearTimeout(timeHideControls)
            const infoElement = document.querySelector('.info');
            const controlsElement = document.querySelector('.controls');
            infoElement.style.animation = '0.3s fadeOut forwards';
            controlsElement.style.animation = '0.3s fadeOut forwards';
            setTimeout(function() {
                infoElement.style.display = 'none';
                controlsElement.style.display = 'none';
            }, 300);
        }

        let isVisibleOverlay = true;
        // Manipulador de clique no overlay
        document.querySelector('.overlay-live').addEventListener('click', () => {
            overlayClickCount++;

            // Verifica se dois cliques consecutivos aconteceram em 500ms
            clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => {
                if (overlayClickCount === 1) {
                    // Primeira vez clicada - Exibe os elementos
                    if (isVisibleOverlay == true) {
                        hideElements();
                    } else {
                        showElements();
                    }

                    isVisibleOverlay = !isVisibleOverlay;
                }

                overlayClickCount = 0; // Reseta o contador se não for um duplo clique
            },
                500);

            if (overlayClickCount > 1) {
                if (orientation == 'landscape') {
                    if (isVisibleChat == true) {
                        ocultarChat();
                    } else {
                        exibirChat();
                    }
                    isVisibleChat = !isVisibleChat;
                }

                overlayClickCount = 0; // Reseta o contador
            }
        });

        // Função para exibir o chat
        function exibirChat() {
            const chatElement = document.getElementById('chat');
            if (chatElement) {
                messages.scrollTop = messages.scrollHeight;
                chatElement.style.display = 'flex';
                const liveVideo = document.querySelector('.live-video');
                liveVideo.style.width = '70%';
            }
        }

        // Função para ocultar o chat
        function ocultarChat() {
            const chatElement = document.getElementById('chat');
            if (chatElement) {
                chatElement.style.display = 'none'; // Oculta o chat
                const liveVideo = document.querySelector('.live-video');
                liveVideo.style.width = '100%';
            }
        }


        // Função para ativar/desativar tela cheia
        function toggleFullscreen() {
            const fullscreenBtn = document.getElementById('fullscreenBtn');
            const liveElement = document.getElementById('liveElement');
            const fullScreen = document.querySelector('.fullscreen svg');

            const requestFullscreen = liveElement.requestFullscreen || liveElement.mozRequestFullScreen || liveElement.webkitRequestFullscreen || liveElement.msRequestFullscreen;
            const exitFullscreen = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen;
            const svgPath = `<path d="M10 4H8v4H4v2h6zM8 20h2v-6H4v2h4zm12-6h-6v6h2v-4h4zm0-6h-4V4h-2v6h6z"/>`;
            const defaultSvgPath = `<path d="M5 5h5V3H3v7h2zm5 14H5v-5H3v7h7zm11-5h-2v5h-5v2h7zm-2-4h2V3h-7v2h5z"/>`;

            if (!document.fullscreenElement) {
                (requestFullscreen ? liveElement.requestFullscreen(): Promise.reject()).then(() => {
                    fullScreen.innerHTML = svgPath;
                }).catch(() => {
                    csl.log('Erro ao tentar entrar em tela cheia');
                });
            } else {
                (exitFullscreen ? document.exitFullscreen(): Promise.reject()).then(() => {
                    fullScreen.innerHTML = defaultSvgPath;
                }).catch(() => {
                    csl.log('Erro ao tentar sair da tela cheia');
                });
            }
        }

        // Adicionar o evento de clique no botão
        fullscreenBtn.addEventListener('click', toggleFullscreen);


        function manageImages(node, isImg) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const img = entry.target;

                        // Armazena o src original no atributo data-src
                        if (!img.dataset.src) {
                            img.dataset.src = img.src;
                        }

                        if (entry.isIntersecting) {
                            // Restaura o src original da imagem
                            img.src = img.dataset.src;

                            // Aplica animação se a imagem estiver visível
                            if (img.complete && img.naturalHeight !== 0) {
                                img.style.animation = '0.1s fadeIn forwards';
                            } else {
                                img.onload = () => {
                                    img.style.animation = '0.1s fadeIn forwards';
                                };
                            }
                        } else {
                            // Remove o src para descarregar a imagem
                            img.src = '';
                            img.style.animation = '';
                            img.style.opacity = '0';
                        }
                    });
                },
                {
                    threshold: 0.01,
                }
            );


            // Processa uma ou várias imagens
            const processImage = (img) => {
                if (img.classList.contains('lazy')) {
                    observer.observe(img);
                } else {
                    if (img.complete && img.naturalHeight !== 0) {
                        img.style.animation = '';
                        img.style.opacity = '1';
                    } else {
                        img.onload = () => {
                            img.style.animation = '0.1s fadeIn forwards';
                        };
                    }
                }
            };

            // Verifica se é um único elemento ou uma lista de nós
            if (!isImg) {
                node.forEach((img) => processImage(img));
            } else {
                processImage(node);
            }
        }

        // Função para monitorar o DOM por mudanças
        const observeImages = () => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    // Verifica se nós foram adicionados
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.tagName === 'IMG') {
                                    manageImages(node, true);
                                } else {

                                    const images = node.querySelectorAll('img.lazy');
                                    manageImages(images, false)
                                }
                                if (node.classList.contains('chat-message')) {
                                    messageAnimation(node);
                                }
                            }
                        });
                    }
                });
            });

            // Configuração para observar o body
            observer.observe(document.body, {
                childList: true, subtree: true
            });
        };

        // Chama a função para iniciar a observação
        observeImages();



        function messageAnimation(node) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const message = entry.target;

                        if (entry.isIntersecting) {
                            message.setAttribute('visible', true);
                            message.style.animation = '0.3s messageBounce ease-out forwards';
                        } else {
                            message.setAttribute('visible', false);
                            message.style.animation = '';
                        }

                    });
                },
                {
                    threshold: 0.01,
                }
            );

            observer.observe(node);
        }