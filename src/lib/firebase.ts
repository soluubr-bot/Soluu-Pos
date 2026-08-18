import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

/**
 * Mesmo projeto Firebase do Soluu Gestão, e o MESMO banco nomeado.
 *
 * Estes valores não são segredo: eles apenas identificam o projeto, e já são
 * públicos no Gestão que roda no navegador de todo cliente. Quem protege os
 * dados são as regras do Firestore e o token de quem está conectado — uma
 * maquininha sem pareamento válido não lê nada.
 *
 * Não existe app Android registrado no Firebase para esta aplicação, e nem
 * precisa: o login é feito com um token gerado pelo nosso próprio servidor no
 * pareamento, e não pelo login nativo do Google. Ver README.
 */
const firebaseConfig = {
  projectId: 'soluugestao',
  appId: '1:979973123744:web:17330c8e3ecfdc4fb3a3c5',
  apiKey: 'AIzaSyC0oqa83Xx_TwNi44aoj0XAxfFhvIodhsA',
  authDomain: 'soluugestao.firebaseapp.com',
  storageBucket: 'soluugestao.firebasestorage.app',
  messagingSenderId: '979973123744',
};

const FIRESTORE_DATABASE_ID = 'soluu-gestao-db';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// `experimentalForceLongPolling`: o Gestão já usa por causa de redes que
// bloqueiam o canal padrão do Firestore. Numa maquininha em 4G isso vale
// ainda mais — melhor perder um pouco de eficiência do que perder a conexão
// no meio de uma cobrança.
export const db = initializeFirestore(
  app,
  { experimentalForceLongPolling: true },
  FIRESTORE_DATABASE_ID
);

export const functions = getFunctions(app, 'southamerica-east1');
