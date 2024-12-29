const axios = require('axios');
const admin = require('firebase-admin');

// Inicializa o Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(), // Você também pode usar uma chave JSON do Firebase para a credencial
    });
}

exports.handler = async (event, context) => {
    const { code } = event.queryStringParameters; // O código de autorização retornado pela Twitch
    const clientId = process.env.TWITCH_CLIENT_ID; // Usando variável de ambiente do Netlify
    const clientSecret = process.env.TWITCH_CLIENT_SECRET; // Usando variável de ambiente do Netlify
    const redirectUri = process.env.TWITCH_REDIRECT_URI; // URL de callback configurada

    if (!code) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Código de autorização ausente' }),
        };
    }

    try {
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

        const accessToken = tokenResponse.data.access_token;

        // Usando o token de acesso para obter os dados do usuário da Twitch
        const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-Id': clientId,
            },
        });

        const user = userResponse.data.data[0];

        // Criando ou autenticando o usuário no Firebase usando o UID do usuário da Twitch
        const firebaseToken = await admin.auth().createCustomToken(user.id);

        // Retorna o token do Firebase para o cliente
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Olá, ${user.display_name}! Você está autenticado.`,
                firebaseToken,
            }),
        };
    } catch (error) {
        console.error('Erro ao processar autenticação:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro interno ao processar o login' }),
        };
    }
};
