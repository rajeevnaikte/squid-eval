/*
    Could simply use eval function, but it can lead to script injections.
    Here only logical and arithmetic operations are processed.
    This module is converting the rule string into prefix notation to evaluate.
    Anything put within single quotes is considered as string. No need of escape sign
    for code keys, just put it within single quotes. And to use a single quote in a text
    simply type it two times ('').
    Variables are to be put between square brackets (can have spaces). e.g. [my variable name]
*/
import { TextPatterns } from './TextParser';
import { InvalidExpError, RuleExistsError, RuleNotExistsError } from "./errors";

type RuleName = string | number;

const textPattern: TextPatterns = {
  split: /('(?:[^']|'')*')/g,
  extract: /'((?:[^']|'')*)'/g,
  replace: [{
    subText: '\'\'',
    replacement: '\''
  }]
};

const toNumIf = (val: any) => {
  if (isNaN(val)) {
    return val.toString();
  } else {
    return parseFloat(val);
  }
};

interface Operator {
  priority: number;
  operate: (left: string, right: string) => any;
}

interface Operators extends Map<string, Operator> {
}

const defaultOperators: Operators = new Map();

defaultOperators.set('+', {
  priority: 0,
  operate: (left: any, right: any) => toNumIf(left) + toNumIf(right)
});
defaultOperators.set('-', {
  priority: 0,
  operate: (left: any, right: any) => toNumIf(left) - toNumIf(right)
});
defaultOperators.set('*', {
  priority: -1,
  operate: (left: any, right: any) => toNumIf(left) * toNumIf(right)
});
defaultOperators.set('/', {
  priority: -1,
  operate: (left: any, right: any) => toNumIf(left) / toNumIf(right)
});
defaultOperators.set('=', {
  priority: 1,
  operate: (left: any, right: any) => (toNumIf(left) === toNumIf(right))
});
defaultOperators.set('!=', {
  priority: 1,
  operate: (left: any, right: any) => (toNumIf(left) !== toNumIf(right))
});
defaultOperators.set('>', {
  priority: 1,
  operate: (left: any, right: any) => (toNumIf(left) > toNumIf(right))
});
defaultOperators.set('<', {
  priority: 1,
  operate: (left: any, right: any) => (toNumIf(left) < toNumIf(right))
});
defaultOperators.set(' contains ', {
  priority: 1,
  operate: (left: any, right: any) => {
    if (Array.isArray(left)) {
      left = left.map(item => item.toString());
    } else {
      left = left.toString();
    }
    return left.includes(right.toString());
  }
});
defaultOperators.set(' and ', {
  priority: 2,
  operate: (left: any, right: any) => (left && right)
});
defaultOperators.set(' or ', {
  priority: 2,
  operate: (left: any, right: any) => (left || right)
});

interface RuleExpPart {
  text?: string;
  variable?: string;
  operator?: string;
  other?: string;
}

export default class RuleEvaluator {
  private operators: Operators;
  // @ts-ignore
  private opsRegex: RegExp;
  private variablePattern: TextPatterns = {
    split: /(\[(?:[^[\]])*\])/g,
    extract: /\[((?:[^[\]])*)\]/g
  };
  private prefixExp: Map<string | number, RuleExpPart[]> = new Map<string | number, RuleExpPart[]>();

  constructor () {
    this.operators = new Map(defaultOperators);
    this.updateOpsRegex();
  }

  private updateOpsRegex () {
    this.opsRegex = this.opsRegexFn();
  }

  addOperator (operator: string, detail: Operator) {
    this.operators.set(operator, detail);
    this.updateOpsRegex();
  }

  deleteOperator (operator: string) {
    this.operators.delete(operator);
    this.updateOpsRegex();
  }

  clearOperators () {
    this.operators.clear();
    this.updateOpsRegex();
  }

  changeOperatorSymbol (currentSymbol: string, newSymbol: string, keepCurrent: boolean = false) {
    if (!this.operators.has(currentSymbol)) throw `Operator ${currentSymbol} doesn't exist.`;
    this.operators.set(newSymbol, <Operator>this.operators.get(currentSymbol));
    if (!keepCurrent) this.operators.delete(currentSymbol);
    this.updateOpsRegex();
  }

  private getOps () {
    return Array.from(this.operators.keys());
  }

  private opsRegexFn () {
    const opsReg = this.getOps().map(op => `[${Array.from(op).join('][')}]`).join('|');
    return new RegExp(`(${opsReg}|[(]|[)])`, 'gi');
  }

  private getPriority (op: string): number {
    return this.operators.get(op)?.priority || 0;
  }

  private isOp = (str: string) => {
    return this.getOps().includes(str.toLowerCase());
  }

  private execOp (left: string, op: string, right: string) {
    // @ts-ignore
    return this.operators.get(op).operate(left, right);
  }

  private splitParts (exp: string): RuleExpPart[] {
    const parts: RuleExpPart[] = [];
    let matches: any;
    for (let item of exp.split(textPattern.split)) {
      matches = textPattern.extract.exec(item);
      if (matches) {
        let text: string = matches[1];
        textPattern.replace?.forEach(rep => {
          text = text.replace(new RegExp(rep.subText, 'g'), rep.replacement);
        });
        parts.push({text});
      } else {
        for (let varPart of item.split(this.variablePattern.split)) {
          matches = this.variablePattern.extract.exec(varPart);
          if (matches) {
            parts.push({variable: matches[1]});
          } else {
            for (let part of varPart.split(this.opsRegex)) {
              if (this.isOp(part)) {
                parts.push({operator: part});
              } else {
                part = part.trim();
                if (part.length > 0) {
                  parts.push({other: part});
                }
              }
            }
          }
        }
      }
    }
    return parts;
  }

  private infixToPrefix (exp: string): RuleExpPart[] {
    const res: RuleExpPart[] = [];
    const parts: RuleExpPart[] = this.splitParts(exp);
    const stack: RuleExpPart[] = [];
    for (let i = parts.length - 1; i >= 0; i--) {
      let partObj = parts[i];
      if (partObj.operator) {
        let part = partObj.operator.toLowerCase();
        while (stack.length > 0 && stack[stack.length - 1].operator && this.getPriority(stack[stack.length - 1].operator || '') < this.getPriority(part)) {
          // @ts-ignore
          res.push(stack.pop());
        }
        stack.push(partObj);
      } else if (partObj.other === ')') {
        stack.push(partObj);
      } else if (partObj.other === '(') {
        while (stack.length > 0 && ![')', '('].includes(stack[stack.length - 1].other || '')) {
          // @ts-ignore
          res.push(stack.pop());
        }
        if (stack.length == 0 || stack[stack.length - 1] === '(') {
          throw new InvalidExpError(exp);
        }
        stack.pop();
      } else {
        res.push(partObj);
      }
    }

    if (stack.find(expPart => [')', '('].includes(expPart.other || ''))) {
      throw new InvalidExpError(exp)
    }

    while (stack.length > 0) {
      // @ts-ignore
      res.push(stack.pop());
    }
    return res.reverse();
  }

  /**
   * Pre processes by parsing the rule expression and keeps in cache with the rule name given as key.
   * @param ruleName
   * @param rule
   * @throws error is thrown if the rule name is already used. Please call update if wanting to update the rule.
   */
  parse (ruleName: RuleName, rule: string) {
    if (this.prefixExp.has(ruleName)) {
      throw new RuleExistsError(ruleName);
    }
    this.update(ruleName, rule);
  }

  /**
   * Update an existing rule name cache with new rule expression.
   * @param ruleName
   * @param newRule
   */
  update (ruleName: RuleName, newRule: string) {
    const processedExp = this.infixToPrefix(newRule);

    try {
      const dummyData = this.getFields(processedExp)
        .reduce((obj: any, variable: string) => {
          obj[variable] = '1';
          return obj
        }, {})
      this.evaluateRule(processedExp, dummyData);
    } catch (e) {
      throw new InvalidExpError(newRule);
    }

    this.prefixExp.set(ruleName, processedExp);
  }

  private getFields (prefixExp: RuleExpPart[]): string[] {
    // @ts-ignore
    return prefixExp.filter(item => item.variable).map(item => item.variable);
  }

  /**
   * Get all the variables used in the rule expression
   * @param ruleName
   */
  getVariables (ruleName: RuleName) {
    if (this.prefixExp.has(ruleName)) {
      // @ts-ignore
      return this.getFields(this.prefixExp.get(ruleName));
    } else {
      throw new RuleNotExistsError(ruleName);
    }
  }

  private getValue (part: RuleExpPart, data: any) {
    if (part.variable) {
      return data[part.variable];
    }
    return part.other || part.text;
  }

  private evaluateRule (prefixExp: RuleExpPart[], data: any) {
    const stack: RuleExpPart[] = [];
    for (let item of prefixExp) {
      if (item.operator || stack[stack.length - 1].operator) {
        stack.push(item);
      } else {
        let left, right = this.getValue(item, data);
        do {
          // @ts-ignore
          left = this.getValue(stack.pop(), data);
          // @ts-ignore
          right = this.execOp(left, stack.pop().operator, right);
        } while (stack.length > 0 && !stack[stack.length - 1].operator);
        if (stack.length === 0) return right;
        stack.push({other: right});
      }
    }
    throw new InvalidExpError('');
  }

  execute (ruleName: RuleName, data: any) {
    if (this.prefixExp.has(ruleName)) {
      try {
        // @ts-ignore
        return this.evaluateRule(this.prefixExp.get(ruleName), data);
      } catch (e) {
        throw new InvalidExpError(`with rule name: '${ruleName}'`);
      }
    }
    throw new RuleNotExistsError(ruleName);
  }
}
