import { signInWithCustomToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from './firebase';
import { getSerial, salvarPareamento, Pareamento } from './device';

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
    modelo: navigator.userAgent.slice(0, 60),
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
