import { useEffect, useState } from 'react';
import { Pareamento } from '../lib/device';
import {
  Cobranca,
  observarCobrancas,
  registrarResultado,
  formatarValor,
  nomeModalidade,
} from '../lib/cobrancas';

interface Props {
  pareamento: Pareamento;
  onDesparear: () => void;
}

type Fase = 'aguardando' | 'cobrando' | 'processando' | 'resultado';

export default function Operacao({ pareamento, onDesparear }: Props) {
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);
  const [fase, setFase] = useState<Fase>('aguardando');
  const [erro, setErro] = useState<string | null>(null);
  const [ultimoResultado, setUltimoResultado] = useState<'paid' | 'canceled' | null>(null);

  useEffect(() => {
    const parar = observarCobrancas(pareamento.tenantId, pareamento.serial, pendentes => {
      setCobranca(atual => {
        // Enquanto o cliente está passando o cartão, não trocamos a cobrança
        // debaixo do operador — mesmo que outra chegue na fila.
        if (atual && (fase === 'cobrando' || fase === 'processando')) {
          return pendentes.find(p => p.orderId === atual.orderId) ? atual : null;
        }
        return pendentes[0] || null;
      });
    });
    return parar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pareamento.tenantId, pareamento.serial]);

  // Cobrança nova chegando enquanto estava parado: mostra na hora.
  useEffect(() => {
    if (cobranca && fase === 'aguardando') setFase('cobrando');
    if (!cobranca && fase === 'cobrando') setFase('aguardando');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cobranca]);

  async function resolver(resultado: 'paid' | 'canceled') {
    if (!cobranca) return;
    setErro(null);
    setFase('processando');
    try {
      await registrarResultado(cobranca.orderId, resultado, {
        nsu: 'TESTE-' + Date.now().toString().slice(-6),
        autorizacao: 'SIMULADO',
      });
      setUltimoResultado(resultado);
      setFase('resultado');
      setTimeout(() => {
        setFase('aguardando');
        setUltimoResultado(null);
      }, 3500);
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível registrar o resultado.');
      setFase('cobrando');
    }
  }

  return (
    <div className="tela">
      <div className="topo">
        <span className="marca">{pareamento.tenantName || 'Soluu'}</span>
        <span className="rotulo">{pareamento.apelido || 'Maquininha'}</span>
      </div>

      {fase === 'resultado' && (
        <div className="centro">
          <p className="valor" style={{ color: ultimoResultado === 'paid' ? 'var(--ok)' : 'var(--danger)' }}>
            {ultimoResultado === 'paid' ? 'Aprovado' : 'Cancelado'}
          </p>
          <p className="descricao">
            {ultimoResultado === 'paid'
              ? 'O Soluu já está registrando a venda.'
              : 'Nada foi cobrado.'}
          </p>
        </div>
      )}

      {(fase === 'cobrando' || fase === 'processando') && cobranca && (
        <>
          <div className="centro">
            <p className="rotulo">{nomeModalidade(cobranca.paymentType)}
              {cobranca.installments && cobranca.installments > 1 ? ` · ${cobranca.installments}x` : ''}
            </p>
            <p className="valor">{formatarValor(cobranca.amount)}</p>
            <p className="descricao">{cobranca.description}</p>
            {cobranca.customerName && <p className="descricao">{cobranca.customerName}</p>}
            {erro && <div className="aviso erro">{erro}</div>}
          </div>

          <div className="rodape">
            {/* Enquanto não existe SDK da adquirente, este botão faz o papel do
                "cartão aprovado". É o único ponto que muda quando o pagamento
                de verdade entrar. */}
            <div className="aviso atencao">
              Pagamento simulado — nenhum cartão é cobrado de verdade.
            </div>
            <button
              className="botao"
              disabled={fase === 'processando'}
              onClick={() => resolver('paid')}
            >
              {fase === 'processando' ? 'Registrando...' : 'Aprovar (teste)'}
            </button>
            <button
              className="botao secundario"
              disabled={fase === 'processando'}
              onClick={() => resolver('canceled')}
            >
              Recusar
            </button>
          </div>
        </>
      )}

      {fase === 'aguardando' && (
        <>
          <div className="centro">
            <p className="rotulo">Aguardando cobrança</p>
            <p className="descricao">
              Feche uma comanda no Soluu escolhendo <strong>Maquininha</strong> e a
              cobrança aparece aqui.
            </p>
          </div>

          <div className="rodape">
            <button className="botao perigo" onClick={onDesparear}>
              Desvincular esta maquininha
            </button>
          </div>
        </>
      )}
    </div>
  );
}
