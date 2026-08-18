import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { lerPareamento, apagarPareamento, Pareamento as TipoPareamento } from './lib/device';
import { parear } from './lib/pareamento';
import TelaPareamento from './screens/Pareamento';
import Operacao from './screens/Operacao';

export default function App() {
  const [pareamento, setPareamento] = useState<TipoPareamento | null>(() => lerPareamento());
  const [carregando, setCarregando] = useState(true);

  /**
   * O vínculo guardado no aparelho e a sessão do Firebase precisam concordar.
   *
   * Se o dono desvincular a maquininha pelo Gestão, o servidor revoga o token —
   * e aqui o Firebase deixa de estar autenticado. Sem esta conferência, o app
   * continuaria mostrando a tela de operação para sempre, sem receber nada.
   */
  useEffect(() => {
    const parar = onAuthStateChanged(auth, usuario => {
      if (!usuario && lerPareamento()) {
        apagarPareamento();
        setPareamento(null);
      }
      setCarregando(false);
    });
    return parar;
  }, []);

  async function aoParear(codigo: string) {
    setPareamento(await parear(codigo));
  }

  function desparear() {
    // Some só deste aparelho. Remover de verdade (revogando o acesso) é feito
    // pelo dono em Configurações → Maquininhas.
    apagarPareamento();
    auth.signOut().catch(() => undefined);
    setPareamento(null);
  }

  if (carregando) {
    return (
      <div className="tela">
        <div className="centro">
          <p className="rotulo">Carregando</p>
        </div>
      </div>
    );
  }

  if (!pareamento) {
    return <TelaPareamento onParear={aoParear} />;
  }

  return <Operacao pareamento={pareamento} onDesparear={desparear} />;
}
