/**
 * ドメイン層の基底エラークラス
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // V8のスタックトレースを正しく保持
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 無効なメールアドレスエラー
 */
export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Invalid email format: ${email}`);
  }
}

/**
 * 無効なトークンエラー
 */
export class InvalidTokenError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * エンティティが見つからないエラー
 */
export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, identifier: string) {
    super(`${entityName} not found: ${identifier}`);
  }
}

/**
 * リソースが見つからないエラー（汎用）
 */
export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * バリデーションエラー（汎用）
 */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * 認可エラー（権限がない操作を試みた場合）
 */
export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized operation') {
    super(message);
  }
}

/**
 * ビジネスルール違反エラー
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * 無効な見積もり値エラー
 */
export class InvalidEstimateValueError extends DomainError {
  constructor(value: number) {
    super(`Invalid estimate value: ${value}. Value must be a positive number.`);
  }
}

/**
 * セッションが既に確定済みエラー
 */
export class SessionAlreadyFinalizedError extends DomainError {
  constructor(sessionId: string) {
    super(`Session is already finalized: ${sessionId}`);
  }
}
