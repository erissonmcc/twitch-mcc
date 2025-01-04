const admin = require('firebase-admin');

// Inicializa o Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON); // Obtém a chave privada da variável de ambiente
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Configuração CORS para liberar todas as URLs
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Permite todas as origens
  'Access-Control-Allow-Headers': 'Authorization, Content-Type', // Permite cabeçalhos Authorization e Content-Type
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Métodos permitidos
};

// Função principal que será executada
exports.handler = async (event, context) => {

  // Se for uma requisição OPTIONS, retorne imediatamente com os cabeçalhos CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const authorizationHeader = event.headers['authorization'];
  const token = authorizationHeader ? authorizationHeader.replace("Bearer ", "") : null;

  // Verifica se o cabeçalho Authorization foi enviado
  if (!token) {
    console.error('Erro: Token de autenticação do Firebase não fornecido');
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Token de autenticação do Firebase não fornecido' }),
    };
  }

  try {
    console.log('Decodificando o token do Firebase...');
    // Verifica e decodifica o token do Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid; // ID do usuário no Firebase
    console.log('Token do Firebase decodificado com sucesso. UID:', userId);

    // Buscando dados no Firestore e token da Twitch em paralelo
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDocPromise = userRef.get(); // Faz a busca no Firestore
    const refreshTokenPromise = userDocPromise.then((userDoc) => {
      if (!userDoc.exists) {
        console.error('Erro: Usuário não encontrado no Firestore. UID:', userId);
        throw new Error('Usuário não encontrado no Firestore');
      }
      return userDoc.data().refreshToken;
    });

    const refreshToken = await refreshTokenPromise;

    if (!refreshToken) {
      console.error('Erro: Refresh token não encontrado para o usuário. UID:', userId);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Refresh token não encontrado' }),
      };
    }

    console.log('Enviando requisição para renovar o token da Twitch...');
    const url = "https://id.twitch.tv/oauth2/token";
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      throw new Error(`Erro ao renovar token: ${response.status} - ${errorDetails.message}`);
    }

    const data = await response.json();
    console.log("Novo token de acesso:", data.access_token);
    console.log("Novo token de atualização:", data.refresh_token);

    // Armazena os tokens no Firestore
    const db = admin.firestore();
    await db.collection('users').doc(userId).set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessTokenExpiresAt: Date.now() + data.expires_in * 1000, // Armazenando o tempo de expiração
    }, { merge: true });

    // Retorna o novo token de acesso
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
      }),
    };

  } catch (error) {
    console.error('Erro durante a execução da função:', error.message);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
