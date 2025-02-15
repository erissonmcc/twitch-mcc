const axios = require('axios');
const admin = require('firebase-admin');

// Converte a variável de ambiente JSON para um objeto
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

// Inicializa o Firebase Admin SDK com a chave JSON
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

exports.handler = async (event, context) => {
    const { code } = event.queryStringParameters; // O código de autorização retornado pela Twitch
    const clientId = process.env.TWITCH_CLIENT_ID; // Usando variável de ambiente do Netlify
    const clientSecret = process.env.TWITCH_CLIENT_SECRET; // Usando variável de ambiente do Netlify
    const redirectUri = process.env.TWITCH_REDIRECT_URI; // URL de callback configurada

    // Log de depuração para verificar a entrada
    console.log('Iniciando o processo de autenticação com a Twitch...');
    console.log('Parâmetros recebidos:', { code, clientId, clientSecret, redirectUri });

    if (!code) {
        console.error('Erro: Código de autorização ausente.');
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Código de autorização ausente' }),
            headers: {
                'Access-Control-Allow-Origin': '*', // Permitir qualquer origem
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        };
    }

    try {
        // Log de depuração para verificar a solicitação à API da Twitch
        console.log('Enviando solicitação para a API da Twitch para troca do código de autorização...');

        // Troca o código de autorização por um token de acesso
        const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            },
        });

        // Log de depuração para verificar a resposta da Twitch
        console.log('Resposta da Twitch - Token:', tokenResponse.data);

        const accessToken = tokenResponse.data.access_token;

        // Usando o token de acesso para obter os dados do usuário da Twitch
        console.log('Enviando solicitação para obter dados do usuário da Twitch...');
        const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-Id': clientId,
            },
        });

        // Log de depuração para verificar a resposta do usuário
        console.log('Resposta da Twitch - Dados do usuário:', userResponse.data);

        const user = userResponse.data.data[0];

        // Verificando se o usuário já existe no Firebase, caso contrário, cria um novo usuário
        let firebaseUser;

        try {
            firebaseUser = await admin.auth().getUserByEmail(user.email);
const db = admin.firestore(); // Firebase Firestore

// Supondo que você tenha o `accessToken` da Twitch
await db.collection('users').doc(firebaseUser.uid).set({
    accessToken: tokenResponse.data.access_token,
    refreshToken: tokenResponse.data.refresh_token,
    accessTokenExpiresAt: Date.now() + tokenResponse.data.expires_in * 1000, // Armazenando o tempo de expiração
}, { merge: true });

console.log('Access token armazenado no Firestore para o usuário:', firebaseUser.uid);

            console.log('Usuário já existe no Firebase Authentication:', firebaseUser.email);
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                console.log('Criando novo usuário no Firebase Authentication...');
                firebaseUser = await admin.auth().createUser({
                    email: user.email,
                    displayName: user.display_name,
                    uid: user.id, // Usando o ID da Twitch como o UID no Firebase
                    photoURL: user.profile_image_url, // Se você quiser incluir a foto do perfil da Twitch
                });
                console.log('Novo usuário criado no Firebase:', firebaseUser.uid);
            } else {
                console.error('Erro ao verificar ou criar o usuário no Firebase:', err);
                throw err;
            }
        }

        // Criando ou autenticando o usuário no Firebase usando o UID do usuário da Twitch
        const firebaseToken = await admin.auth().createCustomToken(firebaseUser.uid);
        console.log(firebaseToken);
        // Retorna o token do Firebase para o cliente
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Olá, ${user.display_name}! Você está autenticado.`,
                firebaseToken,
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        };
    } catch (error) {
        // Log detalhado para capturar o erro
        if (error.response) {
            console.error('Erro na resposta da API da Twitch:', error.response.data);
        } else {
            console.error('Erro desconhecido:', error.message);
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro interno ao processar o login' }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        };
    }
};
