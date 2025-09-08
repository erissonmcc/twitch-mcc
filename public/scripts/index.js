import {
  initializeApp as e
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth as t,
  signInWithCustomToken as n,
  onAuthStateChanged as o
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore as a,
  doc as s,
  getDoc as i,
  onSnapshot as c,
  updateDoc as r,
  increment as l,
  setDoc as d,
  collection as m,
  query as u,
  where as p,
  orderBy as h,
  getDocs as y
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
  getDatabase as f,
  ref as g,
  get as v,
  child as w
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
const b = e({
    apiKey: "AIzaSyBoIHzsTkvvNQxmS5rzO24oLjo9ymyK5-k",
    authDomain: "twitch-mcc.firebaseapp.com",
    projectId: "twitch-mcc",
    storageBucket: "twitch-mcc.firebasestorage.app",
    messagingSenderId: "613197094687",
    appId: "1:613197094687:web:986ad964115326e0beda2a",
    measurementId: "G-3KVKMHDKR3"
  }),
  E = t(b),
  T = a(b);
let x;
const L = "localhost" === window.location.hostname,
  S = L ? "http://localhost:8888/.netlify/functions" : "https://twitch-mcc.netlify.app/.netlify/functions",
  I = "5fyofmchlg3budslz7ivuouz0u8cff";
L || console.warn("AVISO: Este console é destinado a ambientes de e teste. Para garantir sua segurança, nenhuma informação sensível é exibida aqui na área de produção.");
const $ = function(...e) {
    L && console.log(...e)
  },
  k = function(...e) {
    L && console.error(...e)
  },
  q = function(...e) {
    L && console.time(...e)
  },
  B = function(...e) {
    L && console.timeEnd(...e)
  };

const M = document.querySelector(".overlay-live"),
  A = document.getElementById("twitch-embed"),
  _ = new Hammer(M);
_.get("pinch").set({
  enable: !0
}), _.get("pan").set({
  direction: Hammer.DIRECTION_ALL,
  enable: !0
});
let H = 1,
  C = 1,
  z = 0,
  D = 0,
  O = 0,
  j = 0,
  P = !1;
let V, N, R, F, Y, G, U;

function W(e) {
  const t = A.getBoundingClientRect();
  return {
    zoomDeltaX: (e.center.x - t.left - t.width / 2) * (1 - V / H),
    zoomDeltaY: (e.center.y - t.top - t.height / 2) * (1 - V / H)
  }
}

function Q(e) {
  return {
    panDeltaX: e.center.x - O,
    panDeltaY: e.center.y - j
  }
}

function X(e, t, n) {
  const o = (e, t) => (e * t - e) / 2,
    a = o(A.offsetWidth, n),
    s = o(A.offsetHeight, n),
    i = Math.max(-a, Math.min(e, a)),
    c = Math.max(-s, Math.min(t, s));
  A.style.left = `${i}px`, A.style.top = `${c}px`, A.style.transform = `scale(${n})`, H = n
}
_.on("pinchstart", (function(e) {
  O = e.center.x, j = e.center.y, C = H
})), _.on("pinch", (function(e) {
  V = Math.max(1, Math.min(e.scale * C, 2));
  const {
    zoomDeltaX: t,
    zoomDeltaY: n
  } = W(e), {
    panDeltaX: o,
    panDeltaY: a
  } = Q(e);
  X(z + t + o, D + n + a, V)
})), _.on("pinchend", (function(e) {
  const {
    zoomDeltaX: t,
    zoomDeltaY: n
  } = W(e), {
    panDeltaX: o,
    panDeltaY: a
  } = Q(e);
  z += t + o, D += n + a, 1 === H && (z = 0, D = 0)
})), _.on("panstart", (function(e) {
  H > 1 && (P = !0, O = e.center.x, j = e.center.y)
})), _.on("panmove", (function(e) {
  if (P) {
    const t = e.center.x - O,
      n = e.center.y - j;
    X(z + t, D + n, H)
  }
})), _.on("panend", (function(e) {
  P && (z += e.deltaX, D += e.deltaY, P = !1)
}));
export function loginWithTwitch() {
  window.location.href = "login.html"
}
async function J() {
  try {
    const e = async () => (await fetch(`https://api.twitch.tv/helix/channels/followed?user_id=${R}&first=100`, {
      method: "GET",
      headers: {
        "Client-ID": I,
        Authorization: `Bearer ${N}`
      }
    })).json();
    let t = await e();
    "Invalid OAuth token" === t.message && ($("Token expirado, renovando token."), await De(), t = await e());
    const n = t.data;
    $(t);
    const o = await async function(e) {
      const t = [],
        n = e.map((e => e.broadcaster_id));
      try {
        let e = await K(n);
        if ("Invalid OAuth token" === e.message && ($("Token expirado, renovando token."), await De(), e = await K()), e.data.length > 0) {
          const n = e.data.map((e => e.user_id));
          $(n);
          let o = await Z(n);
          "Invalid OAuth token" === o.message && ($("Token expirado, renovando token."), await De(), o = await Z(n));
          const a = Object.fromEntries(o.data.map((e => [e.id, e])));
          e.data.forEach((e => {
            const n = a[e.user_id];
            n && t.push({
              userName: n.display_name,
              userId: n.id,
              description: n.description,
              profileImage: n.profile_image_url,
              title: e.title,
              viewers: e.viewer_count,
              thumbnail: e.thumbnail_url,
              streamUrl: `https://www.twitch.tv/${n.login}`,
              started: e.started_at,
              login: n.login
            })
          }))
        }
        return $(t), t
      } catch (e) {
        console.error("Erro ao verificar as lives:", e)
      }
    }(n);
    ! function(e) {
      const t = document.getElementById("live-streams");
      if (0 === e.length) return void(t.innerHTML = "<p>Não há lives ao vivo no momento.</p>");
      e.forEach((e => {
        const n = document.createElement("div");
        n.classList.add("stream-item"), n.innerHTML = `\n        <div class="thumbnail-conteiner">\n        <img class="thumbnail lazy" src="${e.thumbnail.replace("{width}","1280").replace("{height}","720")}" alt="Capa da stream">\n        </div>\n        <div class="stream-info">\n        <div class="avatar-conteiner">\n        <img class="avatar lazy" src="${e.profileImage}">\n        </div>\n        <div class="info-text">\n        <h2>${e.userName}</h2>\n        <p>${e.title}</p>\n        <p class="viewers">${e.viewers.toLocaleString("pt-BR")} espectadores</p>\n        </div>\n        </div>\n        `, n.addEventListener("click", (function() {
          history.pushState({
            page: "live"
          }, `Live de ${G}`, `/channel/${e.login}`), ne(e.started), ee = setInterval((() => ne(e.started)), 1e3), ae(e), U = setInterval(oe, 15e3), Y = e.userId, F = e.userName, document.querySelector(".live").style.display = "flex", document.getElementById("live-streams").style.display = "none", ce(), we()
        })), t.appendChild(n)
      }));
      document.querySelector(".page-loader").style.display = "none"
    }(o)
  } catch (e) {
    console.error("Erro ao obter canais seguidos:", e)
  }
}

// Função autoexecutável assíncrona
(async function() {
  console.log("Tempo para iniciar");

  // Função q e o parecem ser utilitários, mantendo como estavam
  o(E, async function(user) {
    if (user) {
      // Usuário autenticado
      x = user;
      console.log("Usuário está autenticado:", user);
      R = user.uid;
      G = user.displayName;

      // Função principal assíncrona
      await (async function(userId) {
        // Obtém token do Twitch
        N = await (async function(userId) {
          // Verifica se há token armazenado no localStorage
          let tokenData = JSON.parse(localStorage.getItem("twitchToken"));
          let token = null;

          if (tokenData) {
            const { token: t, expirationTime } = tokenData;
            if (Date.now() < expirationTime) {
              token = t; // Token ainda válido
            } else {
              localStorage.removeItem("twitchToken"); // Remove token expirado
            }
          }

          // Se não tem token, consulta Firestore
          if (!token) {
            console.log("Consulta Firestore");
            const docRef = s(T, "users", userId); // s() parece buscar referência no Firestore
            try {
              const doc = await i(docRef); // i() busca os dados
              if (B("Consulta"), doc.exists()) {
                const { accessToken, accessTokenExpiresAt } = doc.data();
                if (Date.now() < accessTokenExpiresAt) {
                  // Armazena token no localStorage
                  localStorage.setItem(
                    "twitchToken",
                    JSON.stringify({ token: accessToken, expirationTime: accessTokenExpiresAt })
                  );
                  token = accessToken;
                } else {
                  token = await renovarTokenTwitch(); // Renova token expirado
                }
              } else {
                console.log("Nenhum usuário encontrado!");
              }
            } catch (err) {
              console.error("Erro ao obter dados do Firestore:", err);
            }
          }

          // Se ainda não tem token, chama função De() para obter
          token = token || (await De());
          return token;
        })(userId);

        if (N) {
          // Extrai path da URL
          const pathParts = window.location.pathname.split("/");
          console.log(pathParts);

          if (F || Y || pathParts[1] === "channel") {
            if (!F) F = pathParts[2];
            ce(); // Função original

            // Obtém ID do canal Twitch
            Y = await (async function() {
              const url = `https://api.twitch.tv/helix/users?login=${F}`;
              const fetchChannel = async () =>
                (await fetch(url, {
                  method: "GET",
                  headers: {
                    "Client-ID": I,
                    Authorization: `Bearer ${N}`,
                  },
                })).json();

              try {
                let data = await fetchChannel();
                if (data.message === "Invalid OAuth token") {
                  console.log("Token expirado, renovando token.");
                  await De();
                  data = await fetchChannel();
                }
                if (data.data) return data.data[0].id;
                console.error("Canal não encontrado");
              } catch (err) {
                console.error("Erro ao buscar ID do canal:", err);
              }
            })();

            // Função para atualizar informações do canal
            await (async function(channelId) {
              const [streamData, userData] = await Promise.all([K([`${channelId}`]), Z([`${channelId}`])]);
              const info = {};

              if (userData?.data?.[0]?.display_name) info.userName = userData.data[0].display_name;
              if (userData?.data?.[0]?.profile_image_url) info.profileImage = userData.data[0].profile_image_url;
              if (streamData?.data?.[0]?.title) info.title = streamData.data[0].title;
              if (streamData?.data?.[0]?.viewer_count) info.viewers = streamData.data[0].viewer_count.toLocaleString("pt-BR");
              if (streamData?.data?.[0]?.thumbnail_url) {
                info.thumbnail = streamData.data[0].thumbnail_url.replace("{width}", "1280").replace("{height}", "720");
              }

              if (streamData?.data?.[0]) {
                ae(info); // Atualiza UI
                ne(streamData.data[0].started_at);
                ee = setInterval(() => ne(liveChannel.started), 1000);
              }
            })(Y);

            // Atualiza a UI e inicia verificações
            U = setInterval(oe, 5000);
            document.querySelector(".live").style.display = "flex";
            document.getElementById("live-streams").style.display = "none";
            document.querySelector(".page-loader").style.display = "none";
            we();
          } else {
            await J();
            document.querySelector(".page-loader").style.display = "none";
          }
        } else {
          console.error("Falha ao obter o token.");
        }
      })(user.uid);

      B("Tempo para iniciar");
    } else {
      console.log("Usuário não está autenticado", user);
      window.location.href = "login.html"
    }
  });
})();

const K = async e => (await fetch(`https://api.twitch.tv/helix/streams?user_id=${e.join("&user_id=")}`, {
  method: "GET",
  headers: {
    "Client-ID": I,
    Authorization: `Bearer ${N}`
  }
})).json(), Z = async e => (await fetch(`https://api.twitch.tv/helix/users?id=${e.join("&id=")}`, {
  method: "GET",
  headers: {
    "Client-ID": I,
    Authorization: `Bearer ${N}`
  }
})).json();
let ee, te;

function ne(e) {
  const t = new Date(e),
    n = new Date;
  let o = Math.floor((n - t) / 1e3);
  const a = String(Math.floor(o / 3600)).padStart(2, "0");
  o %= 3600;
  const s = String(Math.floor(o / 60)).padStart(2, "0"),
    i = String(o % 60).padStart(2, "0");
  document.getElementById("time").textContent = `${a}:${s}:${i}`
}
async function oe() {
  const e = await K([`${Y}`]);
  if (e.data[0]) {
    const t = {
      title: e.data[0].title,
      viewers: e.data[0].viewer_count.toLocaleString("pt-BR")
    };
    document.querySelector(".info p").textContent = t.title;
    document.querySelector(".info .viewers span").textContent = t.viewers
  } else clearInterval(U)
}

function ae(e) {
  document.getElementById("miniature").innerHTML = `\n    <div class="loading-spinner">\n    <svg class="loading-spinner__circle-svg" viewBox="25 25 50 50">\n    <circle class="loading-spinner__circle-stroke" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10" />\n    </svg>\n    </div>\n    <img class="lazy" src="${e.thumbnail.replace("{width}","1280").replace("{height}","720")}" alt="Miniatura de ${e.userName}">\n    `.trim();
  document.querySelector(".info").innerHTML = `\n    <div class="avatar-conteiner">\n    <img class="avatar lazy" src="${e.profileImage}">\n    </div>\n\n    <div class="info-text">\n    <h2>${e.userName}</h2>\n    <p>${e.title}</p>\n    <div class="viewers"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2 7.5 4.019 7.5 6.5zM20 21h1v-1c0-3.859-3.141-7-7-7h-4c-3.86 0-7 3.141-7 7v1h17z"/></svg> <span>${e.viewers} espectadores</span></div>\n    </div>\n\n    `
}
window.addEventListener("popstate", (function(e) {
  const t = window.location.pathname.split("/");
  $(t), "" !== t[1] && "index" !== t[1] || (se.destroy(), clearInterval(ee), clearInterval(U), te.close(), document.getElementById("liveElement").style.display = "none", document.getElementById("live-streams").style.display = "block", document.getElementById("messages").innerHTML = "")
}));
let se, ie = !0;

function ce() {
  try {
    let t;
    se = new Twitch.Embed("twitch-embed", {
      width: "100%",
      height: "100%",
      channel: F,
      parent: ["twitch-mcc.netlify.app"],
      layout: "video",
      controls: false,
      muted: true,
      autoplay: true,
    }), se.addEventListener(Twitch.Embed.VIDEO_READY, (() => {
      t = se.getPlayer()
    }));
    const n = {
      play: '<path d="M7 6v12l10-6z"/>',
      pause: '<path d="M8 7h3v10H8zm5 0h3v10h-3z"/>',
      mute: '<path d="m7.727 6.313-4.02-4.02-1.414 1.414 18 18 1.414-1.414-2.02-2.02A9.578 9.578 0 0 0 21.999 12c0-4.091-2.472-7.453-5.999-9v2c2.387 1.386 3.999 4.047 3.999 7a8.13 8.13 0 0 1-1.671 4.914l-1.286-1.286C17.644 14.536 18 13.19 18 12c0-1.771-.775-3.9-2-5v7.586l-2-2V2.132L7.727 6.313zM4 17h2.697L14 21.868v-3.747L3.102 7.223A1.995 1.995 0 0 0 2 9v6c0 1.103.897 2 2 2z"/>',
      unmute: '<path d="M16 7v10c1.225-1.1 2-3.229 2-5s-.775-3.9-2-5zM4 17h2.697L14 21.868V2.132L6.697 7H4c-1.103 0-2 .897-2 2v6c0 1.103.897 2 2 2z"/>'
    };

    function e(e) {
      const t = document.querySelector(".toggle svg"),
        o = document.querySelector(".mute svg");
      "play" === e || "pause" === e ? t.innerHTML = n[e] : "mute" !== e && "unmute" !== e || (o.innerHTML = n[e])
    }
    se.addEventListener(Twitch.Embed.VIDEO_PLAY, (function() {
      if (!ie) return;
      Fe(), ie = !1;
      document.getElementById("miniature").style.display = "none", t.setQuality("auto"), document.querySelector(".configs").style.display = "block";
      const e = t.getQualities();
      $("Qualidades", e);
      const n = document.getElementById("qualities");
      n.innerHTML = "";
      const o = document.createElement("form");
      o.classList.add("qualities-form"), e.forEach((e => {
        const n = document.createElement("label");
        n.classList.add("quality-label");
        const a = document.createElement("input");
        a.type = "radio", a.name = "quality", a.value = e.group, a.classList.add("quality-radio"), "auto" == e.group && (a.checked = !0), a.addEventListener("change", (function() {
          t.setQuality(e.group);
          const n = document.getElementById("config-button"),
            o = document.getElementById("config-popup");
          o.style.display = "none", n.style.pointerEvents = "auto", n.style.cursor = "pointer", n.disabled = !1, o.style.animation = "0.3s fadeAndDownIn", setTimeout((function() {
            o.style.animation = "", o.style.display = "none"
          }), 300)
        })), n.textContent = "auto" == e.group ? "Automático" : e.name, n.prepend(a), o.appendChild(n)
      })), n.appendChild(o)
    })), se.addEventListener(Twitch.Embed.VIDEO_PLAY, (() => e("pause"))), se.addEventListener(Twitch.Embed.VIDEO_PAUSE, (() => e("play"))), document.querySelector(".toggle").addEventListener("click", (() => {
      Ye(), t = se.getPlayer(), t && (t.isPaused() ? t.play() : t.pause(), $("Player Paused:", t.isPaused()))
    })), document.querySelector(".mute").addEventListener("click", (() => {
      Ye(), t && (t = se.getPlayer(), t.getMuted() ? (t.setMuted(!1), e("unmute")) : (t.setMuted(!0), e("mute")), $("Player Muted:", t.getMuted()))
    }))
  } catch (o) {
    $("Erro ao iniciar embed:", o)
  }
}

document.querySelector(".reload").addEventListener("click", (() => {
  Ye(), ie = !0;
  const e = document.getElementById("miniature"),
    t = document.querySelector("#miniature img");
  let n = t.src,
    o = (new Date).getTime(),
    a = n.split("?")[0] + "?t=" + o;
  t.src = a, e.style.display = "flex", se.destroy(), ce()
}));
let re = !1,
  le = "none";
document.querySelector(".back").addEventListener("click", (() => {
  if (Ye(), "Qualidade" === le) {
    if (re) return;
    re = !0;
    const e = document.querySelector(".back"),
      t = document.querySelector(".options"),
      n = document.querySelector(".qualities-conteiner"),
      o = document.querySelector(".popup-top");
    e.style.display = "none", n.style.cssText = "\n            position: absolute;\n            animation: 0.3s swipeRightOut;\n            ", o.style.cssText = "\n            position: absolute;\n            animation: 0.3s slideUpInNoP forwards;\n            ", de.style.animation = "0.3s contract forwards", t.style.cssText = "\n            display: block;\n            animation: 0.3s swipeRightIn;\n            ", setTimeout((() => {
      n.style.cssText = "display: none;", t.style.cssText = "", de.style.animation = "", o.style.cssText = "display: none;"
    }), 300), setTimeout((() => {
      re = !1
    }), 600)
  } else alert("Opção desconhecida")
}));
const de = document.getElementById("config-popup");
document.querySelectorAll(".options li").forEach((e => {
  e.addEventListener("click", (t => {
    t.stopPropagation(), Ye();
    const n = e.querySelector("span").innerText;
    if (le = n, "Qualidade" === n) {
      if (1 == re) return;
      re = !0, document.documentElement.style.setProperty("--current-height", `${de.scrollHeight}px`);
      const e = document.querySelector(".back"),
        t = document.querySelector(".options"),
        n = document.querySelector(".qualities-conteiner"),
        o = document.querySelector(".popup-top");
      t.style.cssText = "\n                    position: absolute;\n                    animation: 0.3s swipeLeftOut;\n                    ", e.style.display = "block", n.style.cssText = "\n                    display: flex;\n                    animation: 0.3s swipeLeftIn forwards;\n                    ", o.style.cssText = "\n                    display: flex;\n                    animation: 0.3s slideDownInNoP forwards;\n                    ", document.documentElement.style.setProperty("--new-height", `${de.scrollHeight}px`), de.style.animation = "0.3s expand forwards", setTimeout((() => {
        t.style.cssText = "", de.style.animation = "", t.style.display = "none", o.style.cssText = "\n                        transform: translateY(0);\n                        display: flex;\n                        "
      }), 300), setTimeout((function() {
        re = !1
      }), 600)
    } else alert("Opção desconhecida")
  }))
}));
const me = document.getElementById("config-button");
document.querySelector(".popup-close");
me.addEventListener("click", (function(e) {
  e.stopPropagation(), Ye(), de.style.display = "flex", de.style.animation = "0.3s fadeAndUpIn", setTimeout((function() {
    de.style.animation = ""
  }), 300), me.style.pointerEvents = "none", me.style.cursor = "", me.disabled = !0;
  const t = document.querySelector(".options"),
    n = document.querySelector(".qualities-conteiner"),
    o = document.querySelector(".back");
  t.style.display = "block", n.style.display = "none", o.style.display = "none", $("Esse botão está sendo clicado por algum motivo!")
})), window.addEventListener("click", (function(e) {
  if (e.target !== me) {
    de.style.animation = "0.3s fadeAndDownIn";
    const e = document.querySelector(".popup-top");
    setTimeout((function() {
      de.style.animation = "", de.style.display = "none", e.style.cssText = "display: none; animation: none"
    }), 300), me.style.pointerEvents = "auto", me.style.cursor = "pointer", me.disabled = !1
  }
})), de.addEventListener("click", (e => {
  e.stopPropagation()
}));
const ue = document.getElementById("messages");
async function pe() {
  const e = {
      "Client-ID": I,
      Authorization: `Bearer ${N}`
    },
    t = async t => (await fetch(t, {
      headers: e
    })).json();
  try {
    const e = async e => {
      let n = await t(e);
      return "Invalid OAuth token" === n.message && ($("Token expirado, renovando token."), await De(), n = await t(e)), n
    }, [n, o] = await Promise.all([e("https://api.twitch.tv/helix/chat/badges/global"), e(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${Y}`)]);
    return {
      globalBadges: n.data,
      channelBadges: o.data
    }
  } catch (e) {
    console.error("Erro ao buscar badges:", e)
  }
}
let he, ye, fe, ge = !0,
  ve = 0;
async function we() {
  const e = document.createElement("div");
  e.classList.add("info-message-chat"), e.id = "connectingMessage", e.innerHTML = `<span>Conectando no chat de ${F}...</span>`, e.style.animation = "0.3s messageBounce ease-out forwards", ue.appendChild(e), [fe, ye] = await Promise.all([pe(), ke(Y)]), $(ye), $(fe);
  const t = `oauth:${N}`;
  te = new WebSocket("wss://irc-ws.chat.twitch.tv:443"), te.onopen = () => {
    const e = document.getElementById("connectingMessage");
    e.style.animation = "0.3s messageBounceOut forwards", setTimeout((function() {
      e.remove();
      const t = document.createElement("div");
      t.classList.add("info-message-chat"), t.innerHTML = `<span>Bem-vindo ao chat de ${F}</span>`, t.style.animation = "0.3s messageBounce ease-out forwards", ue.appendChild(t)
    }), 300), $("Conectado ao chat da Twitch!"), te.send("CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership"), te.send(`PASS ${t}`), te.send(`NICK ${G}`), te.send(`JOIN #${F}`)
  }, te.onmessage = async e => {
    const t = e.data;
    let n = Object.fromEntries(t.split(";").map((e => e.split("="))));
    if (t.startsWith("PING")) $("Recebido PING do servidor. Enviando PONG..."), te.send("PONG :tmi.twitch.tv");
    else if (t.includes("CLEARCHAT")) {
      const e = t.match(/CLEARCHAT #[\w]+ :(.+)/);
      x = e[1];
      const o = t.match(/CLEARCHAT #(\S+)/)[1];
      if (x) {
        const e = n["@ban-duration"],
          t = document.createElement("div");
        t.classList.add("info-message-chat"), t.innerHTML = e ? `<span>${x} foi suspenso do chat por ${e}s</span>` : `<span>${x} foi banido do chat</span>`, t.style.animation = "0.3s messageBounce ease-out forwards", ue.appendChild(t);
        const o = document.querySelectorAll(`[user=${x}]`);
        o.length > 0 ? o.forEach((e => {
          Te(e)
        })) : $("Elemento não encontrado")
      } else {
        ue.innerHTML = "";
        const e = document.createElement("div");
        e.classList.add("info-message-chat"), e.innerHTML = `<span>Chat limpo por ${o}</span>`, e.style.animation = "0.3s messageBounce ease-out forwards", ue.appendChild(e)
      }
    } else if (t.includes("CLEARMSG")) {
      const e = document.getElementById(n["target-msg-id"]);
      e && Te(e)
    } else if (t.includes("PRIVMSG")) {
      delete n["user-type"];
      const e = t.match(/PRIVMSG #[\w]+ :(.+)/)[1];
      n.message = e;
      const a = n.emotes.split("/");
      let i;
      i = await qe(e, a, ye);
      const c = Be(n.badges, fe),
        r = document.createElement("div");
      r.classList.add("chat-message");
      const l = `\n                    ${c?`<span class="badges">${c}</span>`:""}\n                    <span class="userName" style="color: ${n.color||xe(n["display-name"])}">${n["display-name"]}:</span> <span class="messageText" user="${n["display-name"].toLowerCase()}" id="${n.id}">${i}</span>\n                    `;
      if ("0" === n["first-msg"] ? r.innerHTML = l : r.innerHTML = `\n                        <div class="box-container">\n                        <div class="box-top">\n                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M21.947 9.179a1.001 1.001 0 0 0-.868-.676l-5.701-.453-2.467-5.461a.998.998 0 0 0-1.822-.001L8.622 8.05l-5.701.453a1 1 0 0 0-.619 1.713l4.213 4.107-1.49 6.452a1 1 0 0 0 1.53 1.057L12 18.202l5.445 3.63a1.001 1.001 0 0 0 1.517-1.106l-1.829-6.4 4.536-4.082c.297-.268.406-.686.278-1.065z"/></svg>\n                        <span>Primeira mensagem</span>\n                        </div>\n                        <div class="box-content">\n                        ${l}\n                        </div>\n                        </div>\n                        `, r.addEventListener("touchstart", (() => {
          he = setTimeout((function() {
            document.querySelector(".sheets-content .records").style.display = "none", document.querySelector(".sheets-content .profile").style.display = "none", document.querySelector(".sheets-content .items").style.display = "block", navigator.vibrate(500), et(), document.getElementById("bottomSheets").setAttribute("user", n["display-name"]), document.getElementById("bottomSheets").setAttribute("message", e)
          }), 500)
        })), r.addEventListener("touchend", (() => {
          clearTimeout(he)
        })), r.addEventListener("touchmove", (() => {
          clearTimeout(he)
        })), ue.appendChild(r), setTimeout((function() {
          r.getAttribute("visible") || (r.style.opacity = "1", r.style.animation = "", r.setAttribute("animationend", !0))
        }), 1e3), !ge) {
        ve++;
        const e = document.querySelector(".back-down"),
          t = document.getElementById("backText");
        t.textContent = ve > 1 ? `${ve} novas mensagens` : `${ve} nova mensagem`, t.style.display = "block", e.style.display = "flex", e.style.animation = "0.3s fadeIn forwards"
      }
      ge && He && !Ce() && (Me.scrollTo({
        top: Me.scrollHeight,
        behavior: "smooth"
      }), He = !1);
      try {
        const e = s(T, `users/${x.uid}/channels/${F}/chat/${crypto.randomUUID()}`);
        await d(e, (o = n, Object.fromEntries(Object.entries(o).filter((([e, t]) => void 0 !== t))))), $("Dados enviados com sucesso!")
      } catch (e) {
        console.error("Erro ao enviar os dados:", e)
      }
    }
    var o
  }, te.onerror = e => {
    console.error("Erro no WebSocket:", e)
  }, te.onclose = e => {
    $("Desconectado do chat da Twitch", e)
  }
}
document.querySelector(".sheets-content .item-profile").addEventListener("click", (async () => {
  await et(), document.querySelector(".sheets-content .items").style.display = "none";
  const e = document.querySelector(".sheets-content .profile");
  e.style.display = "flex", e.innerHTML = '\n            <div class="loading-spinner">\n            <svg class="loading-spinner__circle-svg" viewBox="25 25 50 50">\n            <circle class="loading-spinner__circle-stroke" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10" />\n            </svg>\n            </div>\n            ', et();
  const t = `https://api.twitch.tv/helix/users?login=${document.getElementById("bottomSheets").getAttribute("user")}`;
  try {
    const n = await fetch(t, {
      method: "GET",
      headers: {
        "Client-ID": I,
        Authorization: `Bearer ${N}`
      }
    });
    if (!n.ok) throw new Error("Erro ao obter informações do usuário");
    const o = await n.json();
    if (o.data && o.data.length > 0) {
      const t = o.data[0],
        n = new Date(t.created_at),
        a = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
        s = n.getDate(),
        i = a[n.getMonth()],
        c = n.getFullYear();
      e.innerHTML = `\n                    <div class="profile-basic-information">\n                    <div class="profile-picture">\n                    <img src="${t.profile_image_url}">\n                    </div>\n\n                    <div class="profile-text">\n                    <h2>${t.display_name}</h2>\n\n                    <div class="description">\n                    <p>${t.description}</p>\n                    </div>\n\n                    <div class="date">\n                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M19 5h-6V2h-2v3H5C3.346 5 2 6.346 2 8v10c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V8c0-1.654-1.346-3-3-3zM5 7h14a1 1 0 0 1 1 1l.001 3.12c-.896.228-1.469.734-1.916 1.132-.507.45-.842.748-1.588.748-.745 0-1.08-.298-1.587-.747-.595-.529-1.409-1.253-2.915-1.253-1.505 0-2.319.724-2.914 1.253-.507.45-.841.747-1.586.747-.743 0-1.077-.297-1.582-.747-.447-.398-1.018-.905-1.913-1.133V8a1 1 0 0 1 1-1zM4 18v-4.714c.191.123.374.274.583.461C5.178 14.276 5.991 15 7.495 15c1.505 0 2.319-.724 2.914-1.253.507-.45.841-.747 1.586-.747s1.08.298 1.587.747c.595.529 1.409 1.253 2.915 1.253s2.321-.724 2.916-1.253c.211-.188.395-.34.588-.464L20.002 18H4z"/></svg>\n                    <p>Conta criada em ${s} de ${i} de ${c}</p>\n\n                    </div>\n                    </div>\n\n\n                    </div>\n\n                    `, console.log("Infomacoes do usuário:", t)
    } else console.log("Usuário não encontrado")
  } catch (e) {
    console.error("Erro:", e)
  }
})), document.querySelector(".sheets-content .item-copy").addEventListener("click", (() => {
  ! function(e) {
    const t = document.createElement("textarea");
    t.value = e, document.body.appendChild(t), t.select();
    try {
      document.execCommand("copy"), $("Texto copiado com sucesso!")
    } catch (e) {
      console.error("Falha ao copiar o texto: ", e)
    }
    document.body.removeChild(t)
  }(document.getElementById("bottomSheets").getAttribute("message")), et()
})), document.querySelector(".sheets-content .item-messages").addEventListener("click", (async () => {
  await et(), document.querySelector(".sheets-content .items").style.display = "none";
  const e = document.querySelector(".sheets-content .records");
  e.style.display = "flex", e.innerHTML = '\n            <div class="loading-spinner">\n            <svg class="loading-spinner__circle-svg" viewBox="25 25 50 50">\n            <circle class="loading-spinner__circle-stroke" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10" />\n            </svg>\n            </div>\n            ', et();
  const t = document.getElementById("bottomSheets").getAttribute("user");
  try {
    const e = m(T, `users/${R}/channels/${F}/chat`),
      n = u(e, p("display-name", "==", `${t}`), h("tmi-sent-ts", "asc"));
    $("Consultando informações...");
    const o = await y(n),
      a = o.size;
    let s = 0;
    o.forEach((e => {
      !async function(e, t) {
        const n = function(e) {
            const t = new Date(e);
            if (isNaN(t.getTime())) return {
              error: "Invalid timestamp"
            };
            const n = t.toLocaleDateString(),
              o = t.toLocaleTimeString();
            return {
              date: n,
              time: o
            }
          }(parseInt(e["tmi-sent-ts"])),
          o = e.message,
          a = e.emotes.split("/");
        let s;
        $(ye), s = await qe(o, a, ye);
        const i = e.badges,
          c = Be(i, fe),
          r = document.createElement("div");
        r.classList.add("chat-message-records");
        const l = `\n            ${c?`<span class="badges">${c}</span>`:""}\n            <strong style="color: ${e.color||xe(e["display-name"])}">${e["display-name"]}:</strong>\n            <span class="messageText">${s}</span>\n            `,
          d = document.querySelector(".sheets-content .records");
        if (be.date !== n.date) {
          const e = document.createElement("div");
          e.innerHTML = `<div class="divider"><span>${n.date}</span></div>`, Ee.push(e)
        }
        if (r.innerHTML = `<span class="message-time">${n.time}</span>${l}`, Ee.push(r), t) {
          d.innerHTML = "", Ee.forEach((e => {
            d.appendChild(e)
          }));
          const e = document.querySelector(".sheets-content");
          e.scrollTop = e.scrollHeight, Ee = []
        }
        be = n
      }(e.data(), s === a - 1), s++, $(s)
    })), $(o)
  } catch (e) {
    k("Erro ao recuperar os dados:", e)
  }
}));
let be = {
    date: "none",
    time: "none"
  },
  Ee = [];

function Te(e) {
  !0 !== e.getAttribute("deleted") && (e.setAttribute("original-message", e.innerHTML), e.setAttribute("deleted", !0), e.classList.add("message-deleted"), e.innerHTML = "&lt;mensagem deletada&gt;", e.addEventListener("click", (() => {
    e.getAttribute("original-message") ? (e.innerHTML = e.getAttribute("original-message"), e.classList.remove("message-deleted"), e.removeAttribute("original-message")) : (e.setAttribute("original-message", e.innerHTML), e.classList.add("message-deleted"), e.innerHTML = "&lt;mensagem deletada&gt;")
  })))
}

function xe(e) {
  let t = 0;
  for (let n = 0; n < e.length; n++) t = e.charCodeAt(n) + ((t << 5) - t);
  let n = "#";
  for (let e = 0; e < 3; e++) {
    n += ("00" + (t >> 8 * e & 255).toString(16)).slice(-2)
  }
  return n
}
async function Le() {
  const e = await fetch("https://7tv.io/v3/emote-sets/global");
  if (!e.ok) throw new Error("Falha ao obter emotes globais do 7TV");
  return await e.json()
}
async function Se(e) {
  const t = await fetch(`https://7tv.io/v3/users/twitch/${channel}`);
  if (!t.ok) throw new Error(`Falha ao obter emotes do canal ${e} do 7TV`);
  return await t.json()
}
async function Ie() {
  const e = await fetch("https://api.betterttv.net/3/cached/emotes/global");
  if (!e.ok) throw new Error("Falha ao obter emotes globais do BTTV");
  return await e.json()
}
async function $e(e) {
  const t = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${e}`);
  if (!t.ok) throw new Error(`Falha ao obter emotes do canal ${e} do BTTV`);
  return await t.json()
}
async function ke(e) {
  try {
    const [t, n, o, a] = await Promise.all([Le().catch((() => [])), Ie().catch((() => [])), Se(e).catch((() => [])), $e(e).catch((() => []))]);
    return {
      global7TV: t,
      globalBTTV: n,
      channel7TV: o,
      channelBTTV: a
    }
  } catch (e) {
    return console.error("Erro ao obter emotes:", e), {
      global7TV: [],
      globalBTTV: [],
      channel7TV: [],
      channelBTTV: []
    }
  }
}
async function qe(e, t, n) {
  let o = e;
  const a = {};
  t && t.forEach((t => {
    const [n, s] = t.split(":");
    if (s) {
      s.split(",").forEach(((t, s) => {
        const [i, c] = t.split("-").map(Number), r = Array.from(e).slice(i, c + 1).join(""), l = `__EMOTE_${n}_${s}__`;
        a[l] = `<img class="emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${n}/default/dark/2.0" alt="${n}">`, o = o.replace(r, l)
      }))
    }
  }));
  const s = (e, t, n, s) => {
    const i = new RegExp(`(?<=\\s|^)${e}(?=\\s|$)`, "g"),
      c = "bttv" === s ? `https://cdn.betterttv.net/emote/${t}/${n}` : `https://cdn.7tv.app/emote/${t}/${n}`,
      r = `__EMOTE_${e}__`;
    a[r] = `<img class="emote" src="${c}" alt="${e}">`, o = o.replace(i, r)
  };
  return n.global7TV?.emotes && Object.values(n.global7TV.emotes).forEach((e => {
    s(e.name, e.id, "4x", "7tv")
  })), Array.isArray(n.globalBTTV) && n.globalBTTV.forEach((e => {
    s(e.code, e.id, "3x", "bttv")
  })), n.channel7TV?.emotes && Object.values(n.channel7TV.emotes).forEach((e => {
    s(e.name, e.id, "4x", "7tv")
  })), n.channelBTTV?.channelEmotes && n.channelBTTV.channelEmotes.forEach((e => {
    s(e.code, e.id, "3x", "bttv")
  })), Object.keys(a).forEach((e => {
    o = o.replace(new RegExp(e, "g"), a[e])
  })), o
}

function Be(e, t) {
  if (!e) return "";
  const n = e.split(",");
  let o = "";
  return n.forEach((e => {
    const [n, a] = e.split("/"), s = function(e, t, n) {
      const o = n.channelBadges.find((t => t.set_id === e));
      if (o) {
        const e = o.versions.find((e => e.id === t));
        if (e) return e
      }
      const a = n.globalBadges.find((t => t.set_id === e));
      if (a) {
        const e = a.versions.find((e => e.id === t));
        if (e) return e
      }
      return null
    }(n, a, t);
    s && (o += `<img src="${s.image_url_4x}" alt="${n}" class="badge-icon"> `)
  })), o
}
const Me = document.getElementById("messages");
let Ae, _e = !1,
  He = !0;

function Ce() {
  return Me.scrollHeight - Me.scrollTop - Me.clientHeight <= 20
}
Me.addEventListener("scroll", (async () => {
  if (!ge || He || _e || (clearTimeout(Ae), Ae = setTimeout((async () => {
      await async function() {
        const e = document.querySelectorAll(".chat-message, .info-message-chat"),
          t = e.length;
        if (t > 300) {
          let n = t - 300,
            o = 0;
          for (let t = 0; t < e.length && o < n; t++) {
            const n = e[t];
            "false" === n.getAttribute("visible") && n.remove(), o++
          }
        }
      }(), await nt(25), Ce() ? He = !0 : Ce() || Me.scrollTo({
        top: Me.scrollHeight,
        behavior: "smooth"
      })
    }), 100)), _e) {
    const e = document.querySelector(".back-down");
    if (Ce() && !ge) ge = !0, e.style.animation = "0.3s fadeOut forwards", setTimeout((() => {
      e.style.display = "none"
    }), 300);
    else if (!Ce() && ge) {
      ge = !1;
      document.getElementById("backText").style.display = "none", e.style.display = "flex", e.style.animation = "0.3s fadeIn forwards"
    }
  }
})), Me.addEventListener("touchmove", (() => _e = !0)), Me.addEventListener("touchend", (() => _e = !1));
const ze = document.querySelector(".back-down");
async function De() {
  q("Renovar token");
  const e = await x.getIdToken(!0),
    t = `${S}/renew-token`;
  try {
    const n = await fetch(t, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${e}`,
        "Content-Type": "application/json"
      }
    });
    if (!n.ok) throw new Error(`Erro ao renovar o token: ${n.statusText}`);
    const o = await n.json();
    $(o), N = o.access_token, B("Renovar token")
  } catch (e) {
    console.error("Erro ao fazer a solicitação:", e)
  }
}
let Oe;
ze.addEventListener("click", (function() {
  ze.style.display = "none", ve = 0, ge = !0, Me.scrollTop = Me.scrollHeight
}));
let je = !0;

function Pe() {
  const e = document.getElementById("chat");
  if (window.matchMedia("(orientation: portrait)").matches) {
    Oe = "portrait", e.style.display = "flex";
    document.querySelector(".live-video").style.width = "100%"
  } else if (window.matchMedia("(orientation: landscape)").matches)
    if (Oe = "landscape", 1 == je) {
      e.style.display = "flex";
      document.querySelector(".live-video").style.width = "70%"
    } else {
      e.style.display = "none";
      document.querySelector(".live-video").style.width = "100%"
    }
}
Pe(), window.addEventListener("resize", Pe);
let Ve, Ne = null,
  Re = 0;

function Fe() {
  Ye();
  const e = document.querySelector(".info"),
    t = document.querySelector(".controls");
  e.style.display = "flex", t.style.display = "flex", e.style.animation = "0.3s fadeIn forwards", t.style.animation = "0.3s fadeIn forwards"
}

function Ye() {
  clearTimeout(Ve), Ve = setTimeout((function() {
    Ge(), Ue = !Ue
  }), 3e3)
}

function Ge() {
  clearTimeout(Ve);
  const e = document.querySelector(".info"),
    t = document.querySelector(".controls");
  e.style.animation = "0.3s fadeOut forwards", t.style.animation = "0.3s fadeOut forwards", setTimeout((function() {
    e.style.display = "none", t.style.display = "none"
  }), 300)
}
let Ue = !0;

function We(e, t) {
  const n = new IntersectionObserver((e => {
      e.forEach((e => {
        const t = e.target;
        t.dataset.src || (t.dataset.src = t.src), e.isIntersecting ? (t.src = t.dataset.src, t.complete && 0 !== t.naturalHeight ? t.style.animation = "0.1s fadeIn forwards" : t.onload = () => {
          t.style.animation = "0.1s fadeIn forwards"
        }) : (t.src = "", t.style.animation = "", t.style.opacity = "0")
      }))
    }), {
      threshold: .01
    }),
    o = e => {
      e.classList.contains("lazy") ? n.observe(e) : e.complete && 0 !== e.naturalHeight ? (e.style.animation = "", e.style.opacity = "1") : e.onload = () => {
        e.style.animation = "0.1s fadeIn forwards"
      }
    };
  t ? o(e) : e.forEach((e => o(e)))
}
document.querySelector(".overlay-live").addEventListener("click", (() => {
  Re++, clearTimeout(Ne), Ne = setTimeout((() => {
    1 === Re && (1 == Ue ? Ge() : Fe(), Ue = !Ue), Re = 0
  }), 500), Re > 1 && ("landscape" == Oe && (1 == je ? function() {
    const e = document.getElementById("chat");
    if (e) {
      e.style.display = "none";
      document.querySelector(".live-video").style.width = "100%"
    }
  }() : function() {
    const e = document.getElementById("chat");
    if (e) {
      Me.scrollTop = Me.scrollHeight, e.style.display = "flex";
      document.querySelector(".live-video").style.width = "70%"
    }
  }(), je = !je), Re = 0)
})), fullscreenBtn.addEventListener("click", (function() {
  document.getElementById("fullscreenBtn");
  const e = document.getElementById("liveElement"),
    t = document.querySelector(".fullscreen svg"),
    n = e.requestFullscreen || e.mozRequestFullScreen || e.webkitRequestFullscreen || e.msRequestFullscreen,
    o = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen;
  document.fullscreenElement ? (o ? document.exitFullscreen() : Promise.reject()).then((() => {
    t.innerHTML = '<path d="M5 5h5V3H3v7h2zm5 14H5v-5H3v7h7zm11-5h-2v5h-5v2h7zm-2-4h2V3h-7v2h5z"/>'
  })).catch((() => {
    $("Erro ao tentar sair da tela cheia")
  })) : (n ? e.requestFullscreen() : Promise.reject()).then((() => {
    t.innerHTML = '<path d="M10 4H8v4H4v2h6zM8 20h2v-6H4v2h4zm12-6h-6v6h2v-4h4zm0-6h-4V4h-2v6h6z"/>'
  })).catch((() => {
    $("Erro ao tentar entrar em tela cheia")
  }))
}));
new MutationObserver((e => {
  e.forEach((e => {
    e.addedNodes && e.addedNodes.length > 0 && e.addedNodes.forEach((e => {
      e.nodeType === Node.ELEMENT_NODE && ("IMG" === e.tagName ? We(e, !0) : We(e.querySelectorAll("img.lazy"), !1), e.classList.contains("chat-message") && function(e) {
        const t = new IntersectionObserver((e => {
          e.forEach((e => {
            const t = e.target;
            e.isIntersecting ? (t.setAttribute("visible", !0), t.getAttribute("animationend") || (t.style.animation = "0.1s messageBounce ease-out forwards", t.addEventListener("animationend", (() => {
              t.style.opacity = "1", t.style.animation = "", t.setAttribute("animationend", !0)
            })))) : t.setAttribute("visible", !1)
          }))
        }), {
          threshold: .01
        });
        t.observe(e)
      }(e))
    }))
  }))
})).observe(document.body, {
  childList: !0,
  subtree: !0
});
const Qe = document.getElementById("bottomSheets"),
  Xe = document.getElementById("sheetsHeader"),
  Je = document.querySelector(".background-sheets");
let Ke;
Je.addEventListener("click", (() => {
  et()
}));
let Ze = !1;
async function et() {
  $(Qe.style.transform), "translateY(0px)" === Qe.style.transform ? (Qe.style.animation = "0.3s moveToBottom", Je.style.animation = "0.3s fadeOut forwards", await nt(300), Je.style.display = "none", Qe.style.display = "none", Qe.style.transform = "translateY(100%)") : (Je.style.display = "block", Je.style.animation = "0.3s fadeIn forwards", Qe.style.display = "block", Qe.style.animation = "0.3s moveToTop", setTimeout((function() {
    Qe.style.transform = "translateY(0px)", Qe.style.animation = "none"
  }), 300))
}
Xe.addEventListener("touchstart", (e => {
  Ke = e.touches[0].clientY, Ze = !0, Qe.style.transition = "none"
}));
let tt = 0;

function nt(e) {
  return new Promise((t => setTimeout(t, e)))
}
Xe.addEventListener("touchmove", (e => {
  if (!Ze) return;
  let t = e.touches[0].clientY - Ke;
  requestAnimationFrame((() => {
    tt = Math.max(0, t), Qe.style.transform = `translateY(${tt}px)`
  }))
})), Xe.addEventListener("touchend", (() => {
  Ze = !1, $(tt), tt > 100 ? (Qe.style.animation = "0.3s moveToBottomTo", Je.style.animation = "0.3s fadeOut forwards", setTimeout((function() {
    Je.style.display = "none", Qe.style.display = "none"
  }), 300)) : (Qe.style.animation = "0.3s moveToTopTo", setTimeout((function() {
    Qe.style.transform = "translateY(0px)", Qe.style.animation = "none"
  }), 300))
}));

console.log('HAHAHAHAHA');