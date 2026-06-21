// ─── Online Orders – Request DTOs ───────────────────────────────────────────

/**
 * Single item (or sub-item) within a table order.
 * Supports hierarchical nesting via `subItems` for menus, pizzas, etc.
 */
export interface XdTableOrderItem {
    /** KeyId do artigo (opcional para observações/complementos com Descrição). */
    keyId?: string | null;

    /** Descrição livre — usa a descrição da base de dados se não fornecida. */
    description?: string | null;

    /** Quantidade a encomendar (padrão: 1). */
    quantity?: number;

    /** Substituição de preço (padrão: 0 → usa o preço da base de dados). */
    price?: number;

    /** Identificador da linha de opções para variantes/opções do artigo (padrão: 0). */
    optionsLineId?: number;

    /** Sub-artigos para estrutura hierárquica (menus, pizzas, etc.). */
    subItems?: XdTableOrderItem[] | null;
}

/**
 * Payload for POST /gateway/online-orders/table.
 * Represents a table order with hierarchical item structure.
 */
export interface XdTableOrderPayload {
    /** Número da mesa (deve ser ≠ 0). */
    tableId: number;

    /** Identificador do funcionário/utilizador que efetua o pedido. */
    employeeId: number;

    /** Número de pessoas na mesa (padrão: 0). */
    personsNumber?: number;

    /** Lista de artigos a adicionar ao pedido (mínimo 1 obrigatório). */
    items: XdTableOrderItem[];
}
