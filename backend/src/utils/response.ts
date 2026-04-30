// =============================================
// UTILITÁRIOS DE RESPOSTA PADRONIZADA
// =============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const success = <T>(
  data: T,
  message = 'Operação realizada com sucesso',
  meta?: PaginationMeta
): ApiResponse<T> => ({
  success: true,
  message,
  data,
  ...(meta && { meta }),
});

export const paginate = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Dados obtidos com sucesso'
): ApiResponse<T[]> => ({
  success: true,
  message,
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  },
});

export const buildPagination = (query: {
  page?: string;
  limit?: string;
}) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
