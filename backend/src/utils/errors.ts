// =============================================
// CLASSES DE ERRO PERSONALIZADAS
// =============================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado. Faça login para continuar') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado. Você não tem permissão para esta operação') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  public readonly details?: unknown;

  constructor(message = 'Dados inválidos', details?: unknown) {
    super(message, 400);
    this.details = details;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito: o recurso já existe') {
    super(message, 409);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Erro interno do servidor') {
    super(message, 500, false);
  }
}
