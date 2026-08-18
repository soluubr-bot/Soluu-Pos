import { signInWithCustomToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from './firebase';
import { getSerial, salvarPareamento, Pareamento } from './device';

/**
 * Descrição curta do aparelho, para o dono reconhecer na lista de maquininhas.
 *
 * O user agent cru não serve: numa lista ele vira
 * "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..." e não diz
 * nada a quem está olhando. Na maquininha de verdade o modelo vem do lado
 * nativo (ex.: "DX8000"); no navegador, dizemos que é teste.
 */
function descreverAparelho(): string {
  const nativo = (window as any).SoluuPOS?.modelo;
  if (typeof nativo === 'string' && nativo.trim()) return nativo.trim().slice(0, 40);

  // Modelo do Android aparece entre o "; " e o ")" no user agent.
  const android = navigator.userAgent.match(/Android[^;]*;\s*([^;)]+)/);
  if (android?.[1]) return android[1].trim().slice(0, 40);

  return 'Navegador (teste)';
}

/**
 * Troca o código digitado por uma identidade para este aparelho.
 *
 * A chamada é feita SEM estar autenticado — é justamente a identidade que
 * estamos buscando. O servidor confere o código, registra a maquininha na
 * arena e devolve um token já carimbado com o tenantId.
 *
 * Repare que a arena não é escolhida aqui: ela chega pronta na resposta. Este
 * aparelho não tem como pedir cobranças de outra arena nem que quisesse.
 */
export async function parear(codigo: string): Promise<Pareamento> {
  const serial = getSerial();

  const fn = httpsCallable(functions, 'pairPosDevice');
  const resposta = await fn({
    codigo,
    serial,
    modelo: descreverAparelho(),
  });

  const dados = resposta.data as {
    token: string;
    tenantId: string;
    tenantName: string;
    apelido: string | null;
    serial: string;
  };

  // Entrar com o token é o que dá acesso ao Firestore. A partir daqui o
  // Firebase renova sozinho — o operador não loga de novo todo dia.
  await signInWithCustomToken(auth, dados.token);

  const pareamento: Pareamento = {
    tenantId: dados.tenantId,
    tenantName: dados.tenantName,
    serial: dados.serial || serial,
    apelido: dados.apelido || undefined,
    pareadoEm: new Date().toISOString(),
  };

  salvarPareamento(pareamento);
  return pareamento;
}
