import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Cobranca {
  orderId: string;
  tenantId: string;
  amount: number;            // centavos
  modalidade: string;
  paymentType: string;
  installments?: number;
  description: string;
  customerName?: string;
  status: string;
}

const NOMES_MODALIDADE: Record<string, string> = {
  credit: 'Crédito',
  debit: 'Débito',
  voucher: 'Vale',
  pix: 'Pix',
};

export function nomeModalidade(paymentType: string): string {
  return NOMES_MODALIDADE[paymentType] || paymentType;
}

export function formatarValor(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Fica de olho nas cobranças endereçadas a esta maquininha.
 *
 * Escutamos em vez de perguntar de tempos em tempos porque, com a tela do app
 * aberta no balcão, a cobrança precisa aparecer no instante em que o operador
 * fecha a comanda. O botão "Buscar cobrança" existe para o caso do aparelho ter
 * ficado sem rede e o operador querer forçar.
 */
export function observarCobrancas(
  tenantId: string,
  serial: string,
  cb: (pendentes: Cobranca[]) => void
): () => void {
  const q = query(
    collection(db, 'smartposOrders'),
    where('tenantId', '==', tenantId),
    where('status', '==', 'awaiting')
  );

  return onSnapshot(q, snap => {
    const minhas = snap.docs
      .map(d => ({ ...(d.data() as any), orderId: d.id } as Cobranca & { deviceSerials?: string[] }))
      .filter(c => !c.deviceSerials || c.deviceSerials.includes(serial));
    cb(minhas);
  });
}

/**
 * Registra o resultado do pagamento.
 *
 * A transação relê o pedido antes de escrever: se ele foi cancelado no PDV
 * enquanto o cliente passava o cartão, é melhor descobrir aqui do que gravar
 * por cima de um cancelamento.
 *
 * `pending: true` no caso pago é o que coloca a cobrança na fila de liquidação
 * do Soluu — é por ela que o PDV fecha a comanda, emite a nota e baixa o
 * estoque.
 */
export async function registrarResultado(
  orderId: string,
  resultado: 'paid' | 'canceled',
  comprovante?: { nsu?: string; autorizacao?: string; bandeira?: string }
): Promise<void> {
  const ref = doc(db, 'smartposOrders', orderId);

  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Cobrança não encontrada.');
    if ((snap.data() as any).status !== 'awaiting') {
      throw new Error('Esta cobrança já foi resolvida.');
    }

    tx.update(ref, {
      status: resultado,
      pending: resultado === 'paid',
      ...(resultado === 'paid'
        ? {
            paidAmount: (snap.data() as any).amount,
            paidAt: serverTimestamp(),
            charge: {
              nsu: comprovante?.nsu || null,
              authorizationCode: comprovante?.autorizacao || null,
              schemeName: comprovante?.bandeira || null,
              terminalSerialNumber: (snap.data() as any).deviceSerials?.[0] || null,
            },
          }
        : { canceledAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    });
  });
}
