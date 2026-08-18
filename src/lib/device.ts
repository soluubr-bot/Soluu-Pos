/**
 * Identidade da maquininha e estado do pareamento.
 *
 * Tudo o que fica guardado aqui sobrevive ao fechamento do app, para o
 * operador não precisar parear de novo todo dia.
 */

const CHAVE_PAREAMENTO = 'soluu.pos.pareamento';
const CHAVE_SERIAL_LOCAL = 'soluu.pos.serial-local';

export interface Pareamento {
  tenantId: string;
  tenantName: string;
  /** Serial informado no momento do pareamento. */
  serial: string;
  /** Apelido que o dono deu para esta maquininha (ex.: "Bar", "Loja"). */
  apelido?: string;
  pareadoEm: string;
}

/**
 * Número de série da maquininha.
 *
 * Na maquininha de verdade este valor vem do aparelho, pelo lado nativo — é
 * o mesmo serial impresso na etiqueta traseira. Enquanto o app roda no
 * navegador (desenvolvimento), geramos um identificador fixo por dispositivo
 * para que o pareamento e o endereçamento das cobranças funcionem igual.
 */
export function getSerial(): string {
  const nativo = (window as any).SoluuPOS?.serial;
  if (typeof nativo === 'string' && nativo.trim()) return nativo.trim();

  let local = localStorage.getItem(CHAVE_SERIAL_LOCAL);
  if (!local) {
    local = 'DEV-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    localStorage.setItem(CHAVE_SERIAL_LOCAL, local);
  }
  return local;
}

/** True quando o serial é o de desenvolvimento, e não o do aparelho. */
export function isSerialSimulado(): boolean {
  return getSerial().startsWith('DEV-');
}

export function lerPareamento(): Pareamento | null {
  const bruto = localStorage.getItem(CHAVE_PAREAMENTO);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as Pareamento;
  } catch {
    // Registro corrompido não pode travar o app numa tela inútil: descarta e
    // volta para o pareamento.
    localStorage.removeItem(CHAVE_PAREAMENTO);
    return null;
  }
}

export function salvarPareamento(p: Pareamento): void {
  localStorage.setItem(CHAVE_PAREAMENTO, JSON.stringify(p));
}

export function apagarPareamento(): void {
  localStorage.removeItem(CHAVE_PAREAMENTO);
}
