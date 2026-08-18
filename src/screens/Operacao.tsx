import { Pareamento } from '../lib/device';

interface Props {
  pareamento: Pareamento;
  onDesparear: () => void;
}

/**
 * Tela de trabalho. Fica esperando, mostra a cobrança que o PDV mandou, e o
 * operador toca para cobrar.
 *
 * Por enquanto só o esqueleto: escutar as cobranças entra junto com a função
 * de pareamento no servidor (etapa 2 do plano).
 */
export default function Operacao({ pareamento, onDesparear }: Props) {
  return (
    <div className="tela">
      <div className="topo">
        <span className="marca">{pareamento.tenantName || 'Soluu'}</span>
        <span className="rotulo">{pareamento.apelido || 'Maquininha'}</span>
      </div>

      <div className="centro">
        <p className="rotulo">Aguardando cobrança</p>
        <p className="descricao">
          Feche uma comanda no Soluu escolhendo <strong>Maquininha</strong> e a
          cobrança aparece aqui.
        </p>
      </div>

      <div className="rodape">
        <button className="botao secundario" disabled>
          Buscar cobrança
        </button>
        <button className="botao perigo" onClick={onDesparear}>
          Desvincular esta maquininha
        </button>
      </div>
    </div>
  );
}
