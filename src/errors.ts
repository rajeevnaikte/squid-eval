class BaseError extends Error {
  readonly code: string;

  constructor (code: string, message: string) {
    super(message);
    this.code = code;
  }

  toString (): string {
    return `${this.code}: ${this.message}`;
  }
}

export class NullObjectError extends BaseError {
  constructor () {
    super('NULL_OBJECT', 'null or undefined object found when expected a value');
  }
}

export class InvalidExpError extends BaseError {
  constructor (exp: string) {
    super('INVALID_EXP', `Expression ${exp} is not valid.`);
  }
}

export class RuleExistsError extends BaseError {
  constructor (ruleName: string | number) {
    super('RULE_EXISTS', `Rule name ${ruleName} already exists. Please use other name or call updateRule method.`);
  }
}

export class RuleNotExistsError extends BaseError {
  constructor (ruleName: string | number) {
    super('RULE_NOT_EXISTS', `${ruleName} doesn't exist. Please call parse.`);
  }
}
