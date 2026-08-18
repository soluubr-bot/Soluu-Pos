import { useState } from 'react';
import { lerPareamento, apagarPareamento, Pareamento as TipoPareamento } from './lib/device';
import Pareamento from './screens/Pareamento';
import Operacao from './screens/Operacao';

export default function App() {
  const [pareamento, setPareamento] = useState<TipoPareamento | null>(() => lerPareamento());

  // A chamada de verdade entra na etapa 2, junto com a função de pareamento
  // no servidor. Até lá o botão avisa em vez de fingir que funcionou.
  async function parear(_codigo: string) {
    throw new Error('O pareamento ainda não foi ligado ao servidor. Próxima etapa.');
  }

  function desparear() {
    apagarPareamento();
    setPareamento(null);
  }

  if (!pareamento) {
    return <Pareamento onParear={parear} />;
  }

  return <Operacao pareamento={pareamento} onDesparear={desparear} />;
}
