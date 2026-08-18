/**
 * Mantém a tela acesa enquanto o app estiver aberto.
 *
 * Sem isso a maquininha apaga sozinha e o operador precisa acordar o aparelho
 * antes de cada cobrança — atrito bobo num balcão com fila. A trava é
 * liberada pelo sistema quando o app sai de foco e precisa ser pedida de novo
 * na volta, por isso o listener de visibilidade.
 *
 * A API não existe em todo navegador; onde faltar, o app funciona igual, só
 * não segura a tela.
 */
let trava: any = null;

async function pedirTrava() {
  try {
    const wl = (navigator as any).wakeLock;
    if (!wl?.request) return;
    trava = await wl.request('screen');
  } catch {
    // Negada (bateria fraca, política do aparelho): seguir sem travar.
  }
}

export function manterTelaAcesa(): () => void {
  pedirTrava();

  const aoVoltar = () => {
    if (document.visibilityState === 'visible') pedirTrava();
  };
  document.addEventListener('visibilitychange', aoVoltar);

  return () => {
    document.removeEventListener('visibilitychange', aoVoltar);
    trava?.release?.().catch(() => undefined);
    trava = null;
  };
}
