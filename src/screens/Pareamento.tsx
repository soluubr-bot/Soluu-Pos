import { useState } from 'react';
import { getSerial, isSerialSimulado } from '../lib/device';

interface Props {
  onParear: (codigo: string) => Promise<void>;
}

/**
 * Primeira tela: vincular esta maquininha a uma arena.
 *
 * O dono gera um código em Configurações → Maquininhas no Soluu Gestão e
 * digita aqui. A arena nunca é escolhida no aparelho — ela vem carimbada na
 * resposta do servidor, para uma maquininha não conseguir se passar por outra.
 */
export default function Pareamento({ onParear }: Props) {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const serial = getSerial();

  async function confirmar() {
    setErro(null);
    setEnviando(true);
    try {
      await onParear(codigo.trim());
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível parear. Confira o código e tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tela">
      <div className="topo">
        <span className="marca">Soluu</span>
        <span className="rotulo">Maquininha</span>
      </div>

      <div className="centro">
        <p className="rotulo">Código de pareamento</p>
        <input
          className="campo"
          inputMode="numeric"
          autoComplete="off"
          maxLength={8}
          placeholder="00000000"
          value={codigo}
          onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
        />
        <p className="descricao">
          No Soluu Gestão, abra <strong>Configurações → Maquininhas</strong> e
          toque em <strong>Parear</strong> para gerar o código.
        </p>
        {erro && <div className="aviso erro">{erro}</div>}
      </div>

      <div className="rodape">
        <button
          className="botao"
          disabled={codigo.length < 8 || enviando}
          onClick={confirmar}
        >
          {enviando ? 'Pareando...' : 'Parear'}
        </button>
        <p className="mono">
          Série: {serial}
          {isSerialSimulado() && ' · simulada (modo desenvolvimento)'}
        </p>
      </div>
    </div>
  );
}
